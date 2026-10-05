import { DateTime } from "luxon";
import type { Context, ColorName } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type {
    StatsHistoryWindow,
    StatsChartColumn,
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
 * @param {Context[]} contexts - The contexts to look up context colors from.
 * @returns {StatsDayEntry[]} The day's entries, oldest first.
 */
function buildEntries(dayActivities: TaskActivity[], contexts: Context[]): StatsDayEntry[] {
    const contextMap = new Map(contexts.map((context) => [context.id, context]));
    return [...dayActivities]
        .sort((a, b) => a.date.valueOf() - b.date.valueOf())
        .map((activity) => {
            const context = contextMap.get(activity.contextId);
            const contextColor = context ? (context.color as ColorName) : null;
            return ({
                taskId: activity.taskId,
                title: activity.title,
                time: activity.date.toFormat("hh:mm a"),
                temporary: activity.temporary === true,
                contextColor,
            });
        });
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
                entries: buildEntries(dayActivities, contexts),
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
 * Collects one column per distinct bar color present across chart rows, each
 * carrying the largest single-day count that color reached.
 * @param {StatsDayRow[]} rows - The chart rows to inspect.
 * @returns {StatsChartColumn[]} The columns, in the standard color order
 *   (unknown colors last).
 */
export function chartColumns(rows: StatsDayRow[]): StatsChartColumn[] {
    const maxByColor = new Map<ColorName | null, number>();
    rows.forEach((row) =>
        row.segments.forEach((segment) =>
            maxByColor.set(segment.color, Math.max(maxByColor.get(segment.color) ?? 0, segment.count)),
        ),
    );
    const order = (color: ColorName | null): number =>
        color ? CONTEXT_COLOR_ORDER.indexOf(color) : 999;
    return [...maxByColor.entries()]
        .sort((a, b) => order(a[0]) - order(b[0]))
        .map(([color, maxCount]) => ({ color, maxCount }));
}

/**
 * Resolves the Monday of the calendar week (Mon–Sun) containing a day, as a
 * local ISO date, so two days can be compared for week membership.
 * @param {string} date - A local ISO date.
 * @returns {string} The ISO date of that week's Monday.
 */
export function weekStartIso(date: string): string {
    const day = DateTime.fromISO(date);
    return day.minus({ days: day.weekday - 1 }).toISODate() ?? "";
}

/**
 * Determines whether two days fall in different calendar weeks (Mon–Sun). The
 * chart is newest-first, so the week boundary is the pair of consecutive rows
 * straddling two weeks.
 * @param {string} a - A local ISO date.
 * @param {string} b - A local ISO date.
 * @returns {boolean} True when the dates are in different weeks.
 */
export function isWeekBoundary(a: string, b: string): boolean {
    return weekStartIso(a) !== weekStartIso(b);
}
