import { DateTime } from "luxon";
import type { TaskActivity, TodoistActivity } from "../types/todoist";

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

/**
 * Converts raw activity data into activity logs.
 * @param {TodoistActivity[]} newActivityData - Raw activity data.
 * @param {TodoistActivity[]} newActivityData.results - Raw activity data.
 * @returns {TaskActivity[]} An array of processed activity logs.
 */
export const processActivityData = (newActivityData: {
    results: TodoistActivity[];
}): TaskActivity[] => {
    return newActivityData.results.map((item) => ({
        date: DateTime.fromISO(item.event_date),
        taskId: item.object_id,
        contextId: item.parent_project_id,
        title: item.extra_data.content,
        temporary: null,
    }));
};

/**
 * Merges new activity logs into existing.
 * @param {TaskActivity[]} baseActivity - Existing logs.
 * @param {TaskActivity[]} newActivityData - Logs to merge in.
 * @returns {TaskActivity[]} Merged logs.
 */
export const mergeActivity = (
    baseActivity: TaskActivity[],
    newActivityData: TaskActivity[],
): TaskActivity[] => {
    return newActivityData.reduce(
        (accumulated, newActivity) => {
            const comparisonUnit = (activity: TaskActivity) =>
                activity.temporary || newActivity.temporary ? "minute" : "millisecond";

            const duplicateIndex = accumulated.findIndex(
                (activity) =>
                    activity.taskId === newActivity.taskId &&
                    activity.date.hasSame(newActivity.date, comparisonUnit(activity)),
            );

            if (duplicateIndex === -1) {
                return [...accumulated, newActivity];
            }

            const existingActivity = accumulated[duplicateIndex];

            const shouldReplace = !newActivity.temporary && existingActivity.temporary === true;

            const shouldAddNew =
                !existingActivity.temporary &&
                newActivity.temporary === false &&
                !accumulated.some(
                    (activity) =>
                        activity.taskId === newActivity.taskId &&
                        activity.date.valueOf() === newActivity.date.valueOf(),
                );

            if (shouldReplace) {
                const updatedAccumulated = [...accumulated];
                updatedAccumulated[duplicateIndex] = newActivity;
                return updatedAccumulated;
            }

            if (shouldAddNew) {
                return [...accumulated, newActivity];
            }

            return accumulated;
        },
        [...baseActivity],
    );
};
