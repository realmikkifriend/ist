import { DateTime } from "luxon";
import type { TaskActivity } from "../types/activity";

/**
 * Filters activity logs by timeframe.
 * @param {TaskActivity[]} activities - List of activity logs to filter.
 * @param {DateTime} startDate - Start of date range to filter by.
 * @param {DateTime} endDate - End of date range to filter by.
 * @returns An array of activity logs that fit the timeframe.
 */
export const filterActivityByTimeframe = (
    activities: TaskActivity[],
    startDate: DateTime,
    endDate: DateTime,
): TaskActivity[] => {
    return activities.filter(
        (activity) =>
            activity.date.startOf("day") >= startDate.startOf("day") &&
            activity.date.startOf("day") <= endDate.startOf("day"),
    );
};

/**
 * Verifies whether the provided tasks fulfill the timeframe requirements.
 * @param {TaskActivity[]} activities - List of activity logs to filter.
 * @param {DateTime} startDate - Start of date range to filter by.
 * @param {DateTime}  endDate - End of date range to filter by.
 * @returns A boolean array representing whether the start and end of the timeframe are covered.
 */
export const checkCoverage = (
    activities: TaskActivity[],
    startDate: DateTime,
    endDate: DateTime,
): [boolean, boolean] => {
    const hasStart = activities.some(
        (activity) => activity.date.hasSame(startDate, "day") || activity.date < startDate,
    );
    const hasEnd = activities.some(
        (activity) => activity.date.hasSame(endDate, "day") || activity.date > endDate,
    );
    return [hasStart, hasEnd];
};
