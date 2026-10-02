import { DateTime } from "luxon";
import type { StatsHistoryWindow } from "../types/stats";

/** Number of days of history fetched when the stats view is first opened. */
const STATS_INITIAL_DAYS = 28;

/** Number of days the history window grows per "retrieve more" click. */
const STATS_EXTEND_DAYS = 14;

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
