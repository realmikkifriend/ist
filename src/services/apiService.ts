import { get } from "svelte/store";
import { TodoistRequestError, createCommand } from "@doist/todoist-sdk";
import { todoistAccessToken } from "../stores/secret";
import { formatTaskDate } from "../utils/timeUtils";
import { initializeApi, handleApiError } from "../utils/apiUtils";
import type { DateTime } from "luxon";
import type { UpdateTaskArgs } from "@doist/todoist-sdk";
import type { Task, Context } from "../types/todoist";

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

/**
 * Reorders contexts (projects) in Todoist.
 * @param {Context[]} contexts - The reordered list of contexts.
 * @returns {Promise<{ status: "success" } | { status: "error"; error: TodoistRequestError | string }>} - Result of API call to reorder contexts.
 */
export function reorderContexts(
    contexts: Context[],
): Promise<{ status: "success" } | { status: "error"; error: TodoistRequestError | string }> {
    const api = initializeApi(get(todoistAccessToken));
    if (!api) {
        return Promise.resolve(handleApiError("No access token found."));
    }

    const command = createCommand("project_reorder", {
        projects: contexts.map((context, index) => ({
            id: context.id,
            childOrder: index + 1,
        })),
    });

    return api
        .sync({ commands: [command] })
        .then(() => ({ status: "success" }) as const)
        .catch(handleApiError);
}
