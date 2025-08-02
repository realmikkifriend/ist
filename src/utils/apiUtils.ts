import { get } from "svelte/store";
import { TodoistApi, TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistAccessToken, todoistError } from "../stores/stores";
import { getDueTasks, getReverseTasks } from "../utils/filterUtils";
import { cleanTodoistData } from "../utils/processUtils";
import type { Task, TodoistData, Context, User } from "../types/todoist";
import type { DateTime } from "luxon";
import type { GetProjectsResponse, GetTasksResponse } from "@doist/todoist-api-typescript";

/**
 * Initializes the Todoist API with the current access token.
 * @returns {{ accessToken: string | null, api: TodoistApi | null }} - API ready for calls.
 */
export function initializeApi(): { accessToken: string | null; api: TodoistApi | null } {
    const accessToken = get(todoistAccessToken);
    const api = accessToken ? new TodoistApi(accessToken) : null;
    return { accessToken, api };
}

/**
 * Handles errors returned by the API.
 * @param {unknown} err - Error to be handled.
 * @returns {TodoistRequestError} - Formatted error.
 */
export function handleApiError(err: unknown): TodoistRequestError {
    console.error("Error during API operation:", err);
    if (err instanceof TodoistRequestError) {
        return err;
    }
    if (err instanceof Error) {
        return new TodoistRequestError(err.message);
    }
    if (typeof err === "string") {
        return new TodoistRequestError(err);
    }
    return new TodoistRequestError("An unknown error occurred");
}

/**
 * Process response from API.
 * @param {GetTasksResponse} tasks - Tasks retrieved from API.
 * @param {GetProjectsResponse} projects - Projects retrieved from API.
 * @param {unknown} userResponse - User data retrieved from API.
 * @returns {TodoistData} Processed API data.
 */
export function processApiResponse(
    tasks: GetTasksResponse,
    projects: GetProjectsResponse,
    userResponse: unknown,
): TodoistData {
    const contexts = (projects.results || []).filter(
        (context): context is Context =>
            !!context &&
            typeof context === "object" &&
            "inboxProject" in context &&
            "parentId" in context,
    );

    const user =
        userResponse && typeof userResponse === "object" && "tz_info" in userResponse
            ? (userResponse as User)
            : undefined;

    const cleanedData = cleanTodoistData({
        tasks: tasks.results || [],
        contexts,
        user,
    }) as { tasks: Task[]; contexts: Context[]; user?: User };

    const todoistDataObj: TodoistData = {
        tasks: cleanedData.tasks ?? [],
        contexts: cleanedData.contexts ?? [],
        user: cleanedData.user ?? ({} as User),
        dueTasks: [],
        reverseTasks: {
            tomorrow: [],
            today: [],
        },
    };

    todoistDataObj.dueTasks = getDueTasks(todoistDataObj);
    const reverseTasksTomorrow = getReverseTasks(todoistDataObj);
    const now = new Date();
    const reverseTasksToday = reverseTasksTomorrow.filter((task: Task) => {
        if (!task.due || !(task.due.dateObject instanceof Date)) return false;
        return task.due.dateObject.toDateString() === now.toDateString();
    });
    todoistDataObj.reverseTasks = {
        tomorrow: reverseTasksTomorrow,
        today: reverseTasksToday,
    };

    return todoistDataObj;
}

/**
 * Sets the error state in the store.
 * @param {TodoistRequestError | string} error - The error object or message.
 * @returns {{ status: "error"; error: TodoistRequestError | string }} - Results of error function.
 */
export function setErrorState(error: TodoistRequestError): {
    status: "error";
    error: TodoistRequestError;
} {
    todoistError.set(error.message);
    return { status: "error", error };
}

/**
 * Calls a Todoist API endpoint.
 * @param {string} endpoint - The endpoint to call.
 * @param {Record<string, string>} params - Additional parameters.
 * @returns {Promise<unknown>} - Result of API endpoint call.
 */
export function getEndpoint(
    endpoint: string,
    params: Record<string, string | number> = {},
): Promise<unknown> {
    const accessToken = get(todoistAccessToken);
    const CONTENT_TYPE = "application/x-www-form-urlencoded";
    const stringParams = Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    const queryString = new URLSearchParams(stringParams).toString();
    const url = `https://api.todoist.com/api/v1/${endpoint}${queryString ? `?${queryString}` : ""}`;

    return fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": CONTENT_TYPE,
        },
    }).then((response) =>
        response.ok ? response.json() : Promise.resolve({ error: `Error: ${response.status}` }),
    );
}

/**
 * Formats a DateTime object for a Todoist task.
 * @param {DateTime} time - The time to format.
 * @returns {string} - Formatted time string.
 */
export function formatTaskDate(time: DateTime): string {
    return time.hour === 0 && time.minute === 0 && time.second === 0 && time.millisecond === 0
        ? time.toFormat("yyyy-MM-dd")
        : time.toFormat("yyyy-MM-dd'T'HH:mm:ss");
}
