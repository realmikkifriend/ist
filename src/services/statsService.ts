import { getAllActivityData } from "./activityService";
import type { GetAllActivityDataParams } from "../types/todoist";
import type { TaskActivity } from "../types/activity";

/**
 * Retrieves all task completion activity within the given timeframe.
 * @param {DateTime[]} timeframe - Start and end of the timeframe.
 * @returns {Promise<TaskActivity[]>} Completion activity in the timeframe.
 */
export function fetchCompletionHistory(
    timeframe: GetAllActivityDataParams["timeframe"],
): Promise<TaskActivity[]> {
    return getAllActivityData({
        timeframe,
        accumulatedData: [],
        cursor: null,
        task: null,
        emptyResponsesCount: 0,
    });
}
