import { DateTime } from "luxon";
import type { StatsDayRow, StatsRowLayout } from "../types/stats";
import { isWeekBoundary, ROW_HEIGHT, WEEK_GAP } from "./statsChartUtils";

/**
 * Computes the vertical pixel layout of the chart rows: the week gap
 * following each row, each row's vertical offset (including the gaps above
 * it), and the total height of the chart.
 * @param {StatsDayRow[]} rows - The chart rows, newest first.
 * @returns {StatsRowLayout} The row gaps, row offsets, and chart height.
 */
export function rowLayout(rows: StatsDayRow[]): StatsRowLayout {
    const afterRowGaps = rows.map((row, i) =>
        rows[i + 1] && isWeekBoundary(row.date, rows[i + 1].date) ? WEEK_GAP : 0,
    );
    const cumulativeGaps = afterRowGaps.reduce<number[]>(
        (acc, gap, i) => [...acc, (acc[i - 1] ?? 0) + gap],
        [],
    );
    const rowOffsets = rows.map(
        (_, i) => i * ROW_HEIGHT + (i === 0 ? 0 : (cumulativeGaps[i - 1] ?? 0)),
    );
    const chartHeight =
        rows.length > 0 ? rows.length * ROW_HEIGHT + (cumulativeGaps[rows.length - 2] ?? 0) + 4 : 4;
    return { afterRowGaps, rowOffsets, chartHeight };
}

/**
 * Formats a row date with its abbreviated weekday.
 * @param {string} date - A local ISO date.
 * @returns {string} Formatted date string.
 */
export function dayLabel(date: string): string {
    return DateTime.fromISO(date).toFormat("ccc yyyy-MM-dd");
}

/**
 * Toggles the row tooltip's open state (daisyUI tooltip).
 * @param {Element} element - The row element whose tooltip is toggled.
 * @param {boolean} open - Whether the tooltip should be open.
 */
export function showTooltip(element: Element, open: boolean): void {
    element.classList.toggle("tooltip-open", open);
}
