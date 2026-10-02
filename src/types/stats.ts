import type { ColorName } from "./todoist";

/**
 * The range of completion history fetched into the activity store, as local
 * ISO dates (yyyy-MM-dd).
 */
export interface StatsHistoryWindow {
    oldest: string;
    newest: string;
}

/**
 * One per-color bar of a per-day chart row, in completion-count units
 * (same-colored contexts merged).
 */
export interface StatsDaySegment {
    color: ColorName | null;
    count: number;
}

/**
 * One completion entry in a day's tooltip list, in completion order.
 */
export interface StatsDayEntry {
    taskId: string;
    title: string;
    time: string;
    temporary: boolean;
}

/**
 * One day of the chart, with its per-color segments and completion entries.
 */
export interface StatsDayRow {
    date: string;
    total: number;
    segments: StatsDaySegment[];
    entries: StatsDayEntry[];
}

/**
 * A task ranked by how many days have passed since their last completion.
 */
export interface LongestIdleTask {
    taskId: string;
    title: string;
    contextId: string;
    days: number;
}
