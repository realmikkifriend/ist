import { DateTime } from "luxon";
import type { StatsDayRow } from "../types/stats";
import { ROW_HEIGHT, WEEK_GAP } from "./statsChartUtils";

/**
 * Computes streak status for each day in a boolean array.
 * For each day, returns: 0 = not in a streak, 1 = first day in streak, 2 = middle day in streak, 3 = last day in streak.
 * @param {boolean[]} hit - Boolean array indicating which days hit the goal
 * @returns {number[]} - Number array with streak status codes
 */
export function computeStreakStatus(hit: boolean[]): number[] {
    return hit.map((current, index, array) => {
        if (!current) return 0;
        const prev = index === 0 ? false : array[index - 1];
        const next = index === array.length - 1 ? false : array[index + 1];
        // Return 1 for start (false, true), 3 for end (true, false), 2 for middle (true, true)
        return prev ? (next ? 2 : 3) : next ? 1 : 0;
    });
}

/**
 * The height in pixels of a row's streak highlight rectangle: the row height
 * plus 2px padding, extended over the week gap when the row is the Monday that
 * opens a week (so the highlight reaches down past the gap toward the older
 * week's Sunday row).
 * @param {string} rowDate - The row's local ISO date.
 * @param {number} rowIndex - The row's index in the chart rows.
 * @param {StatsDayRow[]} rows - The chart rows, newest first.
 * @param {number[]} gaps - The week gap inserted after each row.
 * @returns {number} The highlight rectangle's height.
 */
export function streakHighlightHeight(
    rowDate: string,
    rowIndex: number,
    rows: StatsDayRow[],
    gaps: number[],
): number {
    const opensWeek =
        rowIndex < rows.length - 1 &&
        DateTime.fromISO(rowDate).weekday === 1 &&
        DateTime.fromISO(rows[rowIndex + 1].date).weekday === 7 &&
        gaps[rowIndex] === WEEK_GAP;
    return ROW_HEIGHT + 2 + (opensWeek ? WEEK_GAP : 0);
}
