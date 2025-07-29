import { get } from "svelte/store";
import { TodoistApi, TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistAccessToken, todoistData, todoistError } from "./stores";
import { getDueTasks, getReverseTasks } from "./filter";
import { success } from "./toasts";
import { toast } from "@zerodevx/svelte-toast";
import { cleanTodoistData } from "./process";
import type { Task, Comment, TodoistData, Context, User } from "../../types/todoist";
import type { DateTime } from "luxon";
import type {
    UpdateTaskArgs,
    PersonalProject,
    WorkspaceProject,
} from "@doist/todoist-api-typescript";

/**
 * Initializes the Todoist API with the current access token.
 * @returns {{ accessToken: string | null, api: TodoistApi | null }} - API ready for calls.
 */
function initializeApi(): { accessToken: string | null; api: TodoistApi | null } {
    const accessToken = get(todoistAccessToken);
    const api = accessToken ? new TodoistApi(accessToken) : null;
    return { accessToken, api };
}

/**
 * Refreshes Todoist data and updates the store.
 * @returns {Promise<{ status: "success"; error: null } | { status: "error"; error: TodoistRequestError | string } | void>} - Results of API refresh.
 */
export async function refreshData(): Promise<
    | { status: "success"; error: null }
    | { status: "error"; error: TodoistRequestError | string }
    | void
> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return setErrorState(new TodoistRequestError("No access token found."));
    }

    const result = await Promise.all([
        api.getTasks({ limit: 200 }),
        api.getProjects(),
        getEndpoint("user"),
    ]).catch((err: unknown) => {
        console.error("Error fetching data:", err);
        if (err instanceof TodoistRequestError) {
            return setErrorState(err);
        }
        if (err instanceof Error) {
            return setErrorState(new TodoistRequestError(err.message));
        }
        if (typeof err === "string") {
            return setErrorState(new TodoistRequestError(err));
        }
        return setErrorState(new TodoistRequestError("Unknown error"));
    });

    if (!Array.isArray(result)) {
        return result;
    }

    const [tasksResponse, projectsResponse, userResponse] = result;

    if (!tasksResponse || !projectsResponse || !userResponse) {
        return;
    }

    const contexts = Array.isArray(projectsResponse.results)
        ? projectsResponse.results.filter(
              (proj: PersonalProject | WorkspaceProject): proj is Context =>
                  proj && typeof proj === "object" && "inboxProject" in proj && "parentId" in proj,
          )
        : [];

    const user =
        userResponse && typeof userResponse === "object" && "tz_info" in userResponse
            ? (userResponse as User)
            : undefined;

    const cleanedData = cleanTodoistData({
        tasks: tasksResponse.results,
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

    todoistData.set(todoistDataObj);

    success("Todoist data updated!");

    return { status: "success", error: null };
}

/**
 * Sets the error state in the store.
 * @param {TodoistRequestError | string} error - The error object or message.
 * @returns {{ status: "error"; error: TodoistRequestError | string }} - Results of error function.
 */
function setErrorState(error: TodoistRequestError): {
    status: "error";
    error: TodoistRequestError;
} {
    todoistError.set(error.message);
    return { status: "error", error };
}

/**
 * Gets comments for a specific task.
 * @param {string} taskId - The ID of the task for which comments will be retrieved.
 * @returns {Promise<Comment[]>} - Results of comment retrieval, or empty array if error.
 */
export async function getTaskComments(taskId: string): Promise<Comment[]> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        toast.push("Failed to load comments: No access token found.");
        return [];
    }

    return api
        .getComments({ taskId })
        .then((response) => response.results)
        .catch((error: unknown) => {
            const message =
                error instanceof TodoistRequestError
                    ? error.message
                    : error instanceof Error
                      ? error.message
                      : typeof error === "string"
                        ? error
                        : "Unknown error";
            toast.push(`Failed to load comments: ${message}`);
            return [];
        });
}

/**
 * Marks a task as done.
 * @param {string} taskID - The ID of the task to mark done.
 * @returns {Promise<void | { status: "error"; error: TodoistRequestError | string }>} - Result of API call to mark task done.
 */
export async function markTaskDone(
    taskID: string,
): Promise<void | { status: "error"; error: TodoistRequestError | string }> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return setErrorState(new TodoistRequestError("No access token found."));
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
export async function deferTasks(
    taskTimePairs: [Task, DateTime][],
): Promise<(void | { status: "error"; error: TodoistRequestError | string })[]> {
    const { accessToken, api } = initializeApi();
    if (!accessToken || !api) {
        return [setErrorState(new TodoistRequestError("No access token found."))];
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

/**
 * Calls a Todoist API endpoint.
 * @param {string} endpoint - The endpoint to call.
 * @param {Record<string, string>} params - Additional parameters.
 * @returns {Promise<unknown>} - Result of API endpoint call.
 */
export async function getEndpoint(
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

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": CONTENT_TYPE,
        },
    });

    return response.ok ? response.json() : Promise.resolve({ error: `Error: ${response.status}` });
}

/**
 * Formats a DateTime object for a Todoist task.
 * @param {DateTime} time - The time to format.
 * @returns {string} - Formatted time string.
 */
function formatTaskDate(time: DateTime): string {
    return time.hour === 0 && time.minute === 0 && time.second === 0 && time.millisecond === 0
        ? time.toFormat("yyyy-MM-dd")
        : time.toFormat("yyyy-MM-dd'T'HH:mm:ss");
}
