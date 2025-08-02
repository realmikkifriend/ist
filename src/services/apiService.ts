import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistData } from "../stores/stores";
import { error, success } from "../services/toastService";
import { handleOverdueTasks } from "../services/deferService";
import {
    initializeApi,
    handleApiError,
    processApiResponse,
    setErrorState,
    formatTaskDate,
    getEndpoint,
} from "../utils/apiUtils";
import type { DateTime } from "luxon";
import type { UpdateTaskArgs } from "@doist/todoist-api-typescript";
import type { Task, Comment } from "../types/todoist";

/**
 * Refreshes Todoist data and updates the store.
 * @returns {Promise<{ status: "success"; error: null } | { status: "error"; error: TodoistRequestError | string } | void>} - Results of API refresh.
 */
export function refreshData(): Promise<
    | { status: "success"; error: null }
    | { status: "error"; error: TodoistRequestError | string }
    | void
> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return Promise.resolve(setErrorState(new TodoistRequestError("No access token found.")));
    }

    return Promise.all([api.getTasks({ limit: 200 }), api.getProjects(), getEndpoint("user")])
        .then((apiResult) => {
            const [tasks, projects, userResponse] = apiResult;

            if (!tasks || !projects || !userResponse) {
                return;
            }

            handleOverdueTasks(tasks.results || []);
            const todoistDataObj = processApiResponse(tasks, projects, userResponse);

            todoistData.set(todoistDataObj);
            success("Todoist data updated!");
            const successResult: { status: "success"; error: null } = {
                status: "success",
                error: null,
            };
            return successResult;
        })
        .catch((err) => {
            const error = handleApiError(err);
            return setErrorState(error);
        });
}

/**
 * Gets comments for a specific task.
 * @param {string} taskId - The ID of the task for which comments will be retrieved.
 * @returns {Promise<Comment[]>} - Results of comment retrieval, or empty array if error.
 */
export function getTaskComments(taskId: string): Promise<Comment[]> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return Promise.resolve([]);
    }

    return api
        .getComments({ taskId })
        .then((response) => response.results)
        .catch((err: unknown) => {
            const message =
                err instanceof TodoistRequestError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : typeof err === "string"
                        ? err
                        : "Unknown error";
            error(`Failed to load comments: ${message}`);
            return [];
        });
}

/**
 * Marks a task as done.
 * @param {string} taskID - The ID of the task to mark done.
 * @returns {Promise<void | { status: "error"; error: TodoistRequestError | string }>} - Result of API call to mark task done.
 */
export function markTaskDone(
    taskID: string,
): Promise<void | { status: "error"; error: TodoistRequestError | string }> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return Promise.resolve(setErrorState(new TodoistRequestError("No access token found.")));
    }

    return api
        .closeTask(taskID)
        .then(() => {
            success("Task marked as done!");
            return undefined;
        })
        .catch((error: unknown) => {
            if (error instanceof TodoistRequestError) {
                return setErrorState(error);
            }
            if (error instanceof Error) {
                return setErrorState(new TodoistRequestError(error.message));
            }
            if (typeof error === "string") {
                return setErrorState(new TodoistRequestError(error));
            }
            return setErrorState(new TodoistRequestError("Unknown error"));
        });
}

/**
 * Defers multiple tasks to new times.
 * @param {[Task, DateTime][]} taskTimePairs - Array of [Task, DateTime] pairs.
 * @returns {Promise<any[]>} - Results of task-defer API calls.
 */
export function deferTasks(
    taskTimePairs: [Task, DateTime][],
): Promise<(void | { status: "error"; error: TodoistRequestError | string })[]> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return Promise.resolve([setErrorState(new TodoistRequestError("No access token found."))]);
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
            .then(() => undefined)
            .catch((error: unknown) => {
                if (error instanceof TodoistRequestError) {
                    return setErrorState(error);
                }
                if (error instanceof Error) {
                    return setErrorState(new TodoistRequestError(error.message));
                }
                if (typeof error === "string") {
                    return setErrorState(new TodoistRequestError(error));
                }
                return setErrorState(new TodoistRequestError("Unknown error"));
            });
    });

    return Promise.all(updatePromises);
}
