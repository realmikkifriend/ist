import { DateTime } from "luxon";
import type { Context, Task, ColorName } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type {
    StatsHistoryWindow,
    StatsDaySegment,
    StatsDayRow,
    LongestIdleTask,
} from "../types/stats";
import { CONTEXT_COLOR_ORDER } from "./colorOrder";

/** Number of days of history fetched when the stats view is first opened. */
const STATS_INITIAL_DAYS = 28;

/** Number of days the history window grows per "retrieve more" click. */
const STATS_EXTEND_DAYS = 14;

/** Maximum number of entries in the longest-idle list. */
const STATS_LONGEST_IDLE_LIMIT = 10;

/**
 * Builds the initial stats history window, ending today.
 * @param {DateTime} now - The reference moment.
 * @returns {StatsHistoryWindow} The initial window as local ISO dates.
 */
export function initialStatsWindow(now: DateTime = DateTime.now()): StatsHistoryWindow {
    return {
        oldest: now.minus({ days: STATS_INITIAL_DAYS }).toISODate() ?? "",
        newest: now.toISODate() ?? "",
    };
}

/**
 * Computes the range of history not yet covered by the stored window.
 * @param {StatsHistoryWindow | null} window - The stored fetched window, or null.
 * @param {DateTime} now - The reference moment.
 * @returns The range to fetch, or null when the stored window is current.
 */
export function fetchRangeForWindow(
    window: StatsHistoryWindow | null,
    now: DateTime = DateTime.now(),
): [DateTime, DateTime] | null {
    const newest = now.toISODate() ?? "";

    if (window && window.newest === newest) {
        return null;
    }

    const start = window
        ? DateTime.fromISO(window.newest).plus({ days: 1 })
        : now.minus({ days: STATS_INITIAL_DAYS });
    return [start, now.startOf("day")];
}

/**
 * Computes the two-week chunk fetched by "retrieve more" and the resulting
 * extended window.
 * @param {StatsHistoryWindow} window - The stored fetched window.
 * @returns The range to fetch and the window to store afterwards.
 */
export function extendStatsWindow(window: StatsHistoryWindow): {
    range: [DateTime, DateTime];
    next: StatsHistoryWindow;
} {
    const oldest = DateTime.fromISO(window.oldest);
    const rangeStart = oldest.minus({ days: STATS_EXTEND_DAYS });
    return {
        range: [rangeStart, oldest.minus({ days: 1 })],
        next: { oldest: rangeStart.toISODate() ?? "", newest: window.newest },
    };
}

/**
 * Orders segments by their context's position in the standard color order
 * (unknown contexts last), matching the daily goal's segment order.
 * @param {Context[]} contexts - The contexts to look up colors from.
 * @returns A comparator over (contextId, color) pairs.
 */
function compareSegments(contexts: Context[]) {
    const contextColor = new Map(contexts.map((context) => [context.id, context.color]));

    const colorIndex = (contextId: string): number => {
        const color = contextColor.get(contextId);
        const index = color ? CONTEXT_COLOR_ORDER.indexOf(color as ColorName) : -1;
        return index === -1 ? 999 : index;
    };

    return (a: string, b: string): number => colorIndex(a) - colorIndex(b);
}

/**
 * Builds the stacked per-context segments for one day of completions.
 * @param {TaskActivity[]} dayActivities - Completions on a single day.
 * @param {Context[]} contexts - The contexts to look up segment colors from.
 * @returns {StatsDaySegment[]} The day's segments, stacked in order.
 */
function buildSegments(dayActivities: TaskActivity[], contexts: Context[]): StatsDaySegment[] {
    const byContext = new Map<string, TaskActivity[]>();
    dayActivities.forEach((activity) => {
        byContext.set(activity.contextId, [...(byContext.get(activity.contextId) ?? []), activity]);
    });

    return [...byContext.entries()]
        .sort((a, b) => compareSegments(contexts)(a[0], b[0]))
        .map(([contextId, contextActivities]) => ({
            contextId,
            color: (contexts.find((context) => context.id === contextId)?.color ??
                null) as ColorName | null,
            count: contextActivities.length,
        }))
        .reduce((stacked, segment) => {
            const start = stacked[stacked.length - 1]?.end ?? 0;
            return [...stacked, { ...segment, start, end: start + segment.count }];
        }, [] as StatsDaySegment[]);
}

/**
 * Groups completion activity into per-day chart rows with per-context
 * segments, restricted to the given window.
 * @param {TaskActivity[]} activities - The stored completion history.
 * @param {StatsHistoryWindow} window - The window the chart displays.
 * @param {Context[]} contexts - The contexts to look up segment colors from.
 * @returns {StatsDayRow[]} One row per day with completions, oldest first.
 */
export function buildDayStatsRows(
    activities: TaskActivity[],
    window: StatsHistoryWindow,
    contexts: Context[],
): StatsDayRow[] {
    const oldest = DateTime.fromISO(window.oldest).startOf("day");
    const newest = DateTime.fromISO(window.newest).startOf("day");

    const inWindow = activities.filter((activity) => {
        const day = activity.date.startOf("day");
        return day >= oldest && day <= newest;
    });

    const byDay = new Map<string, TaskActivity[]>();
    inWindow.forEach((activity) => {
        const date = activity.date.toISODate() ?? "";
        byDay.set(date, [...(byDay.get(date) ?? []), activity]);
    });

    return [...byDay.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayActivities]) => {
            const segments = buildSegments(dayActivities, contexts);
            return { date, segments, total: segments.reduce((sum, s) => sum + s.count, 0) };
        });
}

/**
 * Ranks open tasks by how many days have passed since their last completion,
 * excluding tasks with no stored completions.
 * @param {Task[]} tasks - The open tasks to rank.
 * @param {TaskActivity[]} activities - The stored completion history.
 * @param {DateTime} now - The reference moment.
 * @returns {LongestIdleTask[]} Ranked entries, longest idle first.
 */
export function getLongestIdleTasks(
    tasks: Task[],
    activities: TaskActivity[],
    now: DateTime = DateTime.now(),
): LongestIdleTask[] {
    const latestByTask = new Map<string, DateTime>();
    activities.forEach((activity) => {
        const latest = latestByTask.get(activity.taskId);
        if (!latest || activity.date > latest) {
            latestByTask.set(activity.taskId, activity.date);
        }
    });

    const today = now.startOf("day");
    const ranked = tasks.flatMap((task) => {
        const latest = latestByTask.get(task.id);
        if (!latest) {
            return [];
        }
        return [
            {
                taskId: task.id,
                title: task.content,
                contextId: task.contextId ?? task.projectId ?? "",
                days: Math.max(0, Math.floor(today.diff(latest.startOf("day"), "days").days)),
            },
        ];
    });

    return ranked.sort((a, b) => b.days - a.days).slice(0, STATS_LONGEST_IDLE_LIMIT);
}
