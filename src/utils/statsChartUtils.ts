import { DateTime } from "luxon";
import type { Context, ColorName } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type {
    StatsHistoryWindow,
    StatsDaySegment,
    StatsDayRow,
    StatsDayEntry,
} from "../types/stats";
import { CONTEXT_COLOR_ORDER } from "./colorOrder";

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
 * Builds the per-color segments (same-colored contexts merged) for one day
 * of completions.
 * @param {TaskActivity[]} dayActivities - Completions on a single day.
 * @param {Context[]} contexts - The contexts to look up segment colors from.
 * @returns {StatsDaySegment[]} The day's segments, ordered by context color.
 */
function buildSegments(dayActivities: TaskActivity[], contexts: Context[]): StatsDaySegment[] {
    const byContext = new Map<string, number>();
    dayActivities.forEach((activity) => {
        byContext.set(activity.contextId, (byContext.get(activity.contextId) ?? 0) + 1);
    });
    const byColor = new Map<ColorName | null, number>();
    [...byContext.entries()]
        .sort((a, b) => compareSegments(contexts)(a[0], b[0]))
        .forEach(([contextId, count]) => {
            const color = (contexts.find((context) => context.id === contextId)?.color ??
                null) as ColorName | null;
            byColor.set(color, (byColor.get(color) ?? 0) + count);
        });
    return [...byColor.entries()].map(([color, count]) => ({ color, count }));
}

/**
 * Builds the day's tooltip entries (its completions, in completion order).
 * @param {TaskActivity[]} dayActivities - Completions on a single day.
 * @returns {StatsDayEntry[]} The day's entries, oldest first.
 */
function buildEntries(dayActivities: TaskActivity[]): StatsDayEntry[] {
    return [...dayActivities]
        .sort((a, b) => a.date.valueOf() - b.date.valueOf())
        .map((activity) => ({
            taskId: activity.taskId,
            title: activity.title,
            time: activity.date.toFormat("hh:mm a"),
            temporary: activity.temporary === true,
        }));
}

/**
 * Groups completion activity into per-day chart rows with per-color segments
 * and completion entries, restricted to the given window.
 * @param {TaskActivity[]} activities - The stored completion history.
 * @param {StatsHistoryWindow} window - The window the chart displays.
 * @param {Context[]} contexts - The contexts to look up segment colors from.
 * @returns {StatsDayRow[]} One row per day with completions, newest first.
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
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayActivities]) => {
            const segments = buildSegments(dayActivities, contexts);
            return {
                date,
                segments,
                entries: buildEntries(dayActivities),
                total: segments.reduce((sum, s) => sum + s.count, 0),
            };
        });
}

/**
 * Colors a day's completion total relative to the user's daily goal:
 * red under the goal, blue from meeting it up to three over, green beyond.
 * @param {number} total - The day's completion count.
 * @param {number} dailyGoal - The user's daily goal.
 * @returns A Tailwind fill class (the inherited color when no goal is set).
 */
export function totalColorClass(total: number, dailyGoal: number): string {
    if (!dailyGoal) {
        return "fill-current";
    }
    if (total < dailyGoal) {
        return "fill-red-500";
    }
    if (total <= dailyGoal + 3) {
        return "fill-blue-500";
    }
    return "fill-green-500";
}

/**
 * Collects the distinct bar colors present across chart rows, in one equal
 * column per color.
 * @param {StatsDayRow[]} rows - The chart rows to inspect.
 * @returns {(ColorName | null)[]} The colors, in the standard color order
 *   (unknown colors last).
 */
export function chartColumnColors(rows: StatsDayRow[]): (ColorName | null)[] {
    const colors = new Set<ColorName | null>();
    rows.flatMap((row) => row.segments).forEach((segment) => colors.add(segment.color));
    const order = (color: ColorName | null): number =>
        color ? CONTEXT_COLOR_ORDER.indexOf(color) : 999;
    return [...colors].sort((a, b) => order(a) - order(b));
}
