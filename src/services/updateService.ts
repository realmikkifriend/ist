import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistData, todoistError, firstDueTask, taskActivity } from "../stores/stores";
import { userSettings, toastMessages } from "../stores/interface";
import { todoistAccessToken, dynalistAccessToken } from "../stores/secret";
import { handleOverdueTasks } from "./deferService";
import { setErrorState, success } from "./toastService";
import { initializeApi, getEndpoint, processApiResponse, handleApiError } from "../utils/apiUtils";
import type { User } from "../types/todoist";

/**
 * Refreshes Todoist data and updates the store.
 * @returns {Promise<{ status: "success"; error: null } | { status: "error"; error: TodoistRequestError | string } | void>} - Results of API refresh.
 */
export function refreshData(): Promise<
    | { status: "success"; error: null }
    | { status: "error"; error: TodoistRequestError | string }
    | void
> {
    const api = initializeApi(get(todoistAccessToken));
    if (!todoistAccessToken || !api) {
        return Promise.resolve(setErrorState(new TodoistRequestError("No access token found.")));
    }

    return Promise.all([
        api.getTasks({ limit: 200 }),
        api.getProjects(),
        getEndpoint(get(todoistAccessToken), "user"),
    ])
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
 * Logs the user out by clearing all relevant stores and showing a toast.
 * @returns {void}
 */
export function handleLogout(): void {
    toastMessages.set([]);
    todoistAccessToken.set("");
    todoistData.set({
        tasks: [],
        contexts: [],
        dueTasks: [],
        reverseTasks: { tomorrow: [], today: [] },
        user: {} as User,
    });
    todoistError.set(null);
    firstDueTask.set(null);
    userSettings.set({ selectedContext: null });
    dynalistAccessToken.set("");
    taskActivity.set([]);
}
