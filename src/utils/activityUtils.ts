import { DateTime } from "luxon";
import { initializeApi } from "./apiUtils";
import { checkCoverage } from "./activityTimeframeUtils";
import type {
    GetCompletedTasksByCompletionDateArgs,
    GetCompletedTasksResponse,
} from "@doist/todoist-sdk";
import type { Task } from "../types/todoist";
import type {
    TaskActivity,
    ProcessActivityAccumulationParams,
    ProcessActivityAccumulationResult,
} from "../types/activity";

/**
 * Retrieves task activity from Todoist API.
 * @param {string} accessToken - The access token for the Todoist API.
 * @param {DateTime[]} timeframe - Timeframe (start and end) to retrieve activity for.
 * @param {Task | null} task - Optional task to filter activity by.
 * @param {string | null} cursor - Optional cursor for pagination.
 * @returns {Promise<GetCompletedTasksResponse>} Completed tasks within the timeframe.
 */
export async function getNewActivity(
    accessToken: string,
    timeframe: DateTime[],
    task: Task | null = null,
    cursor: string | null = null,
): Promise<GetCompletedTasksResponse> {
    const api = initializeApi(accessToken);

    if (!api) {
        return { items: [], nextCursor: null };
    }

    const endpointData = await api.getCompletedTasksByCompletionDate(
        buildCompletedTasksQuery(timeframe, task, cursor),
    );

    return {
        items: filterTasksById(endpointData.items, task),
        nextCursor: endpointData.nextCursor,
    };
}

/**
 * Builds the query arguments for the completed-tasks-by-completion-date endpoint.
 * @param {DateTime[]} timeframe - Timeframe (start and end) to retrieve activity for.
 * @param {Task | null} task - Optional task to narrow the query to its project.
 * @param {string | null} cursor - Optional cursor for pagination.
 * @returns {GetCompletedTasksByCompletionDateArgs} The endpoint query arguments.
 */
const buildCompletedTasksQuery = (
    timeframe: DateTime[],
    task: Task | null,
    cursor: string | null,
): GetCompletedTasksByCompletionDateArgs => {
    const [startDate, endDate] = timeframe;
    return {
        since: startDate.toISODate() ?? "",
        until: endDate.toISODate() ?? "",
        projectId: task?.projectId ?? null,
        cursor,
        limit: 100,
    };
};

/**
 * Filters completed tasks down to a single task if one is provided.
 * @param {Task[]} items - Completed tasks to filter.
 * @param {Task | null} task - Optional task to filter by.
 * @returns {Task[]} Filtered list of completed tasks.
 */
const filterTasksById = (
    items: GetCompletedTasksResponse["items"],
    task: Task | null,
): GetCompletedTasksResponse["items"] => {
    if (task?.id) {
        return items.filter((item) => item.id === task.id);
    }
    return items;
};

/**
 * Converts raw completed task data into activity logs.
 * @param {GetCompletedTasksResponse} newActivityData - Completed tasks retrieved from the API.
 * @returns {TaskActivity[]} An array of processed activity logs.
 */
export const processActivityData = (newActivityData: GetCompletedTasksResponse): TaskActivity[] => {
    return newActivityData.items.map((item) => ({
        date: DateTime.fromISO(item.completedAt?.toISOString() ?? ""),
        taskId: item.id,
        contextId: item.projectId,
        title: item.content,
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
