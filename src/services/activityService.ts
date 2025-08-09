import { get } from "svelte/store";
import { DateTime } from "luxon";
import {
    checkCoverage,
    filterActivityByTimeframe,
    mergeActivity,
    processActivityData,
    shouldContinueFetchingActivity,
    processActivityAccumulation,
} from "../utils/activityUtils";
import { getEndpoint } from "../utils/apiUtils";
import { colorClasses } from "../utils/styleUtils";
import { todoistData, taskActivity } from "../stores/stores";
import { todoistAccessToken } from "../stores/secret";
import type { Task, ColorName } from "../types/todoist";
import type { TaskActivity, TodoistActivity, GetAllActivityDataParams } from "../types/activity";

/**
 * Creates dataset for display.
 * @returns Task activity data for today.
 */
export function fetchDailyActivity(): {
    preliminary: { byContext: TaskActivity[]; byTime: TaskActivity[] };
    promise: Promise<{ byContext: TaskActivity[]; byTime: TaskActivity[] }> | null;
} {
    const startOfToday = DateTime.now().startOf("day");
    const endOfToday = DateTime.now().endOf("day");

    const currentData = get(todoistData);
    const activity = getActivity([startOfToday, endOfToday]);

    const sortActivitiesByColor = (activities: TaskActivity[]) => {
        const colorOrder = Object.keys(colorClasses);
        return [...activities].sort((a, b) => {
            const aContext = currentData.contexts.find((c) => c.id === a.contextId);
            const bContext = currentData.contexts.find((c) => c.id === b.contextId);
            const aColorIndex = aContext ? colorOrder.indexOf(aContext.color as ColorName) : -1;
            const bColorIndex = bContext ? colorOrder.indexOf(bContext.color as ColorName) : -1;
            return aColorIndex - bColorIndex;
        });
    };

    const byContext = sortActivitiesByColor(activity.data);
    const byTime = [...activity.data].sort((a, b) => a.date.toMillis() - b.date.toMillis());

    const preliminary = { byContext, byTime };

    if (activity.promise) {
        const promise = activity.promise.then((promisedActivity) => {
            const combinedActivity = mergeActivity(activity.data, promisedActivity);

            const promisedByContext = sortActivitiesByColor(combinedActivity);
            const promisedByTime = [...combinedActivity].sort(
                (a, b) => a.date.toMillis() - b.date.toMillis(),
            );
            return { byContext: promisedByContext, byTime: promisedByTime };
        });
        return { preliminary, promise };
    }

    return { preliminary, promise: null };
}

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
        const allUpdatedActivityData = await getAllActivityData({
            timeframe,
            accumulatedData: relevantActivity,
            cursor: null,
            task,
            emptyResponsesCount: 0,
        });

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
 * @param {GetAllActivityDataParams} params - Parameters for retrieving activity data.
 * @returns {Promise<TaskActivity[]>} - A promise that resolves to an array of TaskActivity objects.
 */
const getAllActivityData = async ({
    timeframe,
    accumulatedData = [],
    cursor = null,
    task,
    emptyResponsesCount = 0,
}: GetAllActivityDataParams): Promise<TaskActivity[]> => {
    const [startDate, endDate] = timeframe;
    const newActivityData = (await getNewActivity(task, cursor)) as {
        next_cursor: string | null;
        results: TodoistActivity[];
    };

    const processedActivityData: TaskActivity[] = processActivityData(newActivityData);

    const { currentAccumulatedData, updatedEmptyResponsesCount, done } =
        processActivityAccumulation({
            processedActivityData,
            accumulatedData,
            startDate,
            endDate,
            emptyResponsesCount,
        });

    if (
        shouldContinueFetchingActivity(
            newActivityData.next_cursor,
            done,
            updatedEmptyResponsesCount,
        )
    ) {
        return getAllActivityData({
            timeframe,
            accumulatedData: currentAccumulatedData,
            cursor: newActivityData.next_cursor,
            task,
            emptyResponsesCount: updatedEmptyResponsesCount,
        });
    }

    return currentAccumulatedData;
};

/**
 * Retrieves task activity from Todoist API.
 * @param {Task | null} task - Optional task to filter activity by.
 * @param {string | null} cursor - Optional cursor for pagination.
 * @returns Task activity history data.
 */
export async function getNewActivity(task: Task | null = null, cursor: string | null = null) {
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

    const endpointData = await getEndpoint(get(todoistAccessToken), "activities", params);

    return endpointData;
}
