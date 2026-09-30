import { TodoistApi, TodoistRequestError } from "@doist/todoist-sdk";
import { getDueTasks, filterContexts } from "../utils/filterUtils";
import { cleanTodoistData, extractUser } from "../utils/processUtils";
import type { GetProjectsResponse, GetTasksResponse } from "@doist/todoist-sdk";
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
 * Handles errors returned by the API and formats them for consistent error responses.
 * @param {unknown} err - Error to be handled.
 * @returns {{ status: "error"; error: TodoistRequestError }} - Formatted error object.
 */
export function handleApiError(err: unknown): { status: "error"; error: TodoistRequestError } {
    console.error("Error during API operation:", err);

    if (err instanceof TodoistRequestError) {
        return { status: "error", error: err };
    }
    if (err instanceof Error) {
        return { status: "error", error: new TodoistRequestError(err.message) };
    }
    if (typeof err === "string") {
        return { status: "error", error: new TodoistRequestError(err) };
    }
    return { status: "error", error: new TodoistRequestError("An unknown error occurred") };
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
    const contexts = filterContexts(projects);
    const user = extractUser(userResponse);

    const cleanedData = cleanTodoistData({
        tasks: tasks.results || [],
        contexts,
        user,
    }) as { tasks: Task[]; contexts: Context[]; user?: User };

    cleanedData.tasks = cleanedData.tasks.map((task) => {
        if (task.labels && task.labels.includes("never-mark-done")) {
            return { ...task, neverDone: true };
        }
        return task;
    });

    const todoistDataObj: TodoistData = {
        tasks: cleanedData.tasks ?? [],
        contexts: cleanedData.contexts ?? [],
        user: cleanedData.user ?? ({} as User),
        dueTasks: [],
    };

    todoistDataObj.dueTasks = getDueTasks(todoistDataObj);

    return todoistDataObj;
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
                } as unknown as Comment,
            ];
        });
}
