import { get } from "svelte/store";
import { DateTime } from "luxon";
import { getEndpoint } from "../../js/api";
import { taskActivity } from "../../stores/stores";
import type { Task, TaskActivity, TodoistActivity } from "../../../types/todoist";

/**
 * Checks stores for task activity and gets more from the API.
 * @param {DateTime[]} timeframe - Timeframe (start and end) to filter activity by.
 * @param {Task | null} task - Optional task to filter activity by.
 * @returns Retrieved activity records from the store and a promise of more if retrieved.
 */
export function getActivity(
    timeframe: DateTime[],
    task: Task | null = null,
): {
    data: TaskActivity[];
    promise: Promise<TaskActivity[]> | null;
} {
    const storedActivityData = get(taskActivity).filter(
        (activity) => !task?.id || activity.taskId === task.id,
    );

    const [startDate, endDate] = timeframe;

    const relevantActivity = filterActivityByTimeframe(storedActivityData, startDate, endDate);

    const [startCovered, endCovered] = checkCoverage(relevantActivity, startDate, endDate);

    if (!startDate.hasSame(DateTime.now(), "day") && startCovered && endCovered) {
        return { data: relevantActivity, promise: null };
    }

    const promise = (async () => {
        const allUpdatedActivityData = await getAllActivityData(
            startDate,
            endDate,
            relevantActivity,
            null,
            task,
        );

        const relevantUpdatedActivity = filterActivityByTimeframe(
            allUpdatedActivityData,
            startDate,
            endDate,
        );

        const mergedActivityData = mergeActivity(get(taskActivity), allUpdatedActivityData);

        taskActivity.set(mergedActivityData);

        return relevantUpdatedActivity;
    })();

    return { data: relevantActivity, promise };
}

/**
 * Retrieves all activity data within the specified timeframe.
 * Uses recursion to handle pagination.
 * @param {DateTime} startDate - Start of date range to filter by.
 * @param {DateTime} endDate - End of date range to filter by.
 * @param {TaskActivity[]} accumulatedData - Accumulated activity log data.
 * @param {string | null} cursor - The cursor for pagination.
 * @param {Task | null} task - Optional task to filter activity by.
 * @returns {Promise<TaskActivity[]>} - A promise that resolves to an array of TaskActivity objects.
 */
const getAllActivityData = async (
    startDate: DateTime,
    endDate: DateTime,
    accumulatedData: TaskActivity[] = [],
    cursor: string | null = null,
    task: Task | null,
): Promise<TaskActivity[]> => {
    const newActivityData = (await getNewActivity(task, cursor)) as {
        next_cursor: string | null;
        results: TodoistActivity[];
    };

    const processedActivityData: TaskActivity[] = processActivityData(newActivityData);
    const allData = mergeActivity(accumulatedData, processedActivityData);

    const [startCovered, endCovered] = checkCoverage(allData, startDate, endDate);

    const startIsToday = startDate.hasSame(DateTime.now(), "day");
    const done = startCovered && (endCovered || startIsToday);

    if (newActivityData.next_cursor && !done) {
        return getAllActivityData(startDate, endDate, allData, newActivityData.next_cursor, task);
    }

    return allData;
};

/**
 * Filters activity logs by timeframe.
 * @param {TaskActivity[]} activities - List of activity logs to filter.
 * @param {DateTime} startDate - Start of date range to filter by.
 * @param {DateTime} endDate - End of date range to filter by.
 * @returns An array of activity logs that fit the timeframe.
 */
const filterActivityByTimeframe = (
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
const checkCoverage = (
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
 * Retrieves task activity from Todoist API.
 * @param {Task | null} task - Optional task to filter activity by.
 * @param {string | null} cursor - Optional cursor for pagination.
 * @returns Task activity history data.
 */
export async function getNewActivity(task: Task | null = null, cursor: string | null = null) {
    const params: Record<string, string | number> = {
        limit: 10,
        object_type: "item",
        event_type: "completed",
    };

    if (task?.id) {
        params.object_id = String(task.id);
    }

    if (cursor) {
        params.cursor = cursor;
    }

    const endpointData = await getEndpoint("activities", params);

    return endpointData;
}

const processActivityData = (newActivityData: { results: TodoistActivity[] }): TaskActivity[] => {
    return newActivityData.results.map((item) => ({
        date: DateTime.fromISO(item.event_date),
        taskId: item.object_id,
        contextId: item.parent_project_id,
        title: item.extra_data.content,
        temporary: null,
    }));
};

const mergeActivity = (
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
