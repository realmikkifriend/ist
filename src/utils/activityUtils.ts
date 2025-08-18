import { DateTime } from "luxon";
import { getEndpoint } from "./apiUtils";
import { checkCoverage } from "./activityTimeframeUtils";
import type { Task } from "../types/todoist";
import type {
    TaskActivity,
    TodoistActivity,
    ProcessActivityAccumulationParams,
    ProcessActivityAccumulationResult,
} from "../types/activity";

/**
 * Retrieves task activity from Todoist API.
 * @param {string} accessToken - The access token for the Todoist API.
 * @param {Task | null} task - Optional task to filter activity by.
 * @param {string | null} cursor - Optional cursor for pagination.
 * @returns {Promise<{results: TodoistActivity[]}>} Task activity history data.
 */
export async function getNewActivity(
    accessToken: string,
    task: Task | null = null,
    cursor: string | null = null,
): Promise<{ results: TodoistActivity[] }> {
    const params: Record<string, string | number> = {
        limit: 100,
        object_type: "item",
        event_type: "completed",
    };

    if (task?.id) {
        params.object_id = String(task.id);
    }

    if (cursor) {
        params.cursor = cursor;
    }

    const endpointData = await getEndpoint<{ results: TodoistActivity[] }>(
        accessToken,
        "activities",
        params,
    );

    return endpointData;
}

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
 * @param {TaskActivity[]} accumulated - Existing logs.
 * @param {TaskActivity[]} newActivity - Logs to merge in.
 * @returns {TaskActivity[]} Merged logs.
 */
const handleNewActivityMerge = (
    accumulated: TaskActivity[],
    newActivity: TaskActivity,
): TaskActivity[] => {
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
        return accumulated.map((activity, index) =>
            index === duplicateIndex ? { ...newActivity } : activity,
        );
    }

    if (shouldAddNew) {
        return [...accumulated, newActivity];
    }

    return accumulated;
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
    return newActivityData.reduce(handleNewActivityMerge, [...baseActivity]);
};

/**
 * Checks inputs to determine whether activity-fetching should continue.
 * @param {string | null} nextCursor - The API cursor if provided.
 * @param {boolean} done - Whether the timeframe has been fulfilled.
 * @param {number} emptyResponsesCount - The number of empty responses received so far.
 * @returns {boolean} Whether or not to continue fetching activity.
 */
export function shouldContinueFetchingActivity(
    nextCursor: string | null,
    done: boolean,
    emptyResponsesCount: number,
): boolean {
    return Boolean(nextCursor && !done && emptyResponsesCount < 2);
}

/**
 * Processes accumulated activity data.
 * @param {TaskActivity[]} processedActivityData - Data that has already been processed.
 * @returns {ProcessActivityAccumulationResult} Activity data that has been processed.
 */
export function processActivityAccumulation({
    processedActivityData,
    accumulatedData,
    startDate,
    endDate,
    emptyResponsesCount,
}: ProcessActivityAccumulationParams): ProcessActivityAccumulationResult {
    const currentAccumulatedData =
        processedActivityData.length > 0
            ? mergeActivity(accumulatedData, processedActivityData)
            : accumulatedData;

    const updatedEmptyResponsesCount =
        processedActivityData.length === 0 ? emptyResponsesCount + 1 : 0;

    const [startCovered, endCovered] = checkCoverage(currentAccumulatedData, startDate, endDate);

    const startIsToday = startDate.hasSame(DateTime.now(), "day");
    const done = startCovered && (endCovered || startIsToday);

    return { currentAccumulatedData, updatedEmptyResponsesCount, done };
}
