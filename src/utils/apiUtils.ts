import { TodoistApi, TodoistRequestError } from "@doist/todoist-api-typescript";
import { getDueTasks, getReverseTasks } from "../utils/filterUtils";
import { cleanTodoistData } from "../utils/processUtils";
import type { GetProjectsResponse, GetTasksResponse } from "@doist/todoist-api-typescript";
import type { Task, TodoistData, Context, User, Comment } from "../types/todoist";

/**
 * Initializes the Todoist API with the current access token.
 * @param {string} accessToken - The access token for the Todoist API.
 * @returns {TodoistApi | null} - API ready for calls.
 */
export function initializeApi(accessToken: string): TodoistApi | null {
    const api = accessToken ? new TodoistApi(accessToken) : null;
    return api;
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
 * Calls a Todoist API endpoint.
 * @param {string} accessToken - The access token for the Todoist API.
 * @param {string} endpoint - The endpoint to call.
 * @param {Record<string, string>} params - Additional parameters.
 * @returns {Promise<unknown>} - Result of API endpoint call.
 */
export function getEndpoint(
    accessToken: string,
    endpoint: string,
    params: Record<string, string | number> = {},
): Promise<unknown> {
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
 * Gets comments for a specific task.
 * @param {string} accessToken - The access token for the Todoist API.
 * @param {string} taskId - The ID of the task for which comments will be retrieved.
 * @returns {Promise<Comment[]>} - Results of comment retrieval, or empty array if error.
 */
export function getTaskComments(accessToken: string, taskId: string): Promise<Comment[]> {
    const api = initializeApi(accessToken);
    if (!api) {
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
            return [
                {
                    content: `Failed to load comments: ${message}`,
                    postedAt: new Date().toISOString(),
                    id: "error-comment",
                    taskId: taskId,
                } as Comment,
            ];
        });
}
