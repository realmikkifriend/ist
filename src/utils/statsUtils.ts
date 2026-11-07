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
 * Counts the days of history covered by a fetched window.
 * @param {StatsHistoryWindow} window - The fetched window.
 * @returns {number} The number of retrieved days (oldest to newest).
 */
export function statsWindowDays(window: StatsHistoryWindow): number {
    const oldest = DateTime.fromISO(window.oldest);
    const newest = DateTime.fromISO(window.newest);
    return Math.round(newest.diff(oldest, "days").days);
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
 * Advances the day-chart display window one chunk back and reports whether
 * the new range reaches beyond the stored (fetched) window and must be
 * pulled from the API.
 * @param {string} displayOldest - The oldest date the chart currently shows.
 * @param {StatsHistoryWindow | null} storage - The stored fetched window.
 * @returns The new oldest date to display, and the API range to fetch (null
 *   when the new range is already covered by storage).
 */
export function nextDisplayWindow(
    displayOldest: string,
    storage: StatsHistoryWindow | null,
): { oldest: string; apiRange: [DateTime, DateTime] | null } {
    const next = DateTime.fromISO(displayOldest).minus({ days: STATS_EXTEND_DAYS });
    const storageOldest = storage ? DateTime.fromISO(storage.oldest) : null;
    const apiRange: [DateTime, DateTime] | null =
        storageOldest && next < storageOldest ? [next, storageOldest.minus({ days: 1 })] : null;
    return { oldest: next.toISODate() ?? "", apiRange };
}
