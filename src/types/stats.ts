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
 * One chart column: a bar color and the largest single-day count that color
 * reached in the window. Column widths and bar scaling key off this max.
 */
export interface StatsChartColumn {
    color: ColorName | null;
    maxCount: number;
}

/**
 * A chart column with its computed pixel layout: a proportional width and a
 * horizontal start offset within the chart area.
 */
export interface StatsColumnLayout extends StatsChartColumn {
    /** The column's computed width in pixels. */
    width: number;
    /** The column's horizontal start offset in pixels. */
    start: number;
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
    contextColor: ColorName | null;
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
 * The computed vertical pixel layout of the chart rows: the week gap
 * following each row, each row's vertical offset, and the total height.
 */
export interface StatsRowLayout {
    /** Gap after each row (the week gap when the next row starts a new week). */
    afterRowGaps: number[];
    /** Vertical pixel offset of each row, including the gaps above it. */
    rowOffsets: number[];
    /** Total height of the chart in pixels. */
    chartHeight: number;
}

/**
 * A task ranked by how many days have passed since their last completion.
 * Tasks with no completion in the retrieved window rank first, with the
 * window size shown as a lower bound.
 */
export interface LongestIdleTask {
    taskId: string;
    title: string;
    contextId: string;
    days: number;
    /** True when the task has no completion in the retrieved window. */
    beyondWindow: boolean;
}
