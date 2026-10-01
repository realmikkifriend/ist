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
 * One stacked segment of a per-day chart row, in completion-count units.
 */
export interface StatsDaySegment {
    contextId: string;
    color: ColorName | null;
    count: number;
    start: number;
    end: number;
}

/**
 * One day of the chart, with its per-context segments stacked in order.
 */
export interface StatsDayRow {
    date: string;
    total: number;
    segments: StatsDaySegment[];
}

/**
 * A task ranked by how many days have passed since its last completion.
 */
export interface LongestIdleTask {
    taskId: string;
    title: string;
    contextId: string;
    days: number;
}
