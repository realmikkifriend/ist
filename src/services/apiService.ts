import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistAccessToken } from "../stores/secret";
import { formatTaskDate } from "../utils/timeUtils";
import { initializeApi, handleApiError } from "../utils/apiUtils";
import type { DateTime } from "luxon";
import type { UpdateTaskArgs } from "@doist/todoist-api-typescript";
import type { Task } from "../types/todoist";

/**
 * Marks a task as done.
 * @param {string} taskID - The ID of the task to mark done.
 * @returns {Promise<void | { status: "error"; error: TodoistRequestError | string }>} - Result of API call to mark task done.
 */
export function markTaskDone(
    taskID: string,
): Promise<{ status: "success" } | { status: "error"; error: TodoistRequestError }> {
    const api = initializeApi(get(todoistAccessToken));
    if (!api) {
        return Promise.resolve(handleApiError("No access token found."));
    }

    return api
        .closeTask(taskID)
        .then(() => ({ status: "success" }) as const)
        .catch(handleApiError);
}

/**
 * Defers multiple tasks to new times.
 * @param {[Task, DateTime][]} taskTimePairs - Array of [Task, DateTime] pairs.
 * @returns {Promise<any[]>} - Results of task-defer API calls.
 */
export function deferTasks(
    taskTimePairs: [Task, DateTime][],
): Promise<({ status: "success" } | { status: "error"; error: TodoistRequestError })[]> {
    const api = initializeApi(get(todoistAccessToken));
    if (!api) {
        return Promise.resolve([handleApiError("No access token found.")]);
    }

    const updatePromises = taskTimePairs.map(([task, time]) => {
        const formattedDate = formatTaskDate(time);
        const updateObj: Partial<UpdateTaskArgs> = {
            dueString: task.due?.string ?? "",
        };
        if (formattedDate.includes("T")) {
            updateObj.dueDatetime = formattedDate;
        } else {
            updateObj.dueDate = formattedDate;
        }
        return api
            .updateTask(task.id, updateObj as UpdateTaskArgs)
            .then(() => ({ status: "success" }) as const)
            .catch(handleApiError);
    });

    return Promise.all(updatePromises);
}
