import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistAccessToken } from "../stores/secret";
import { handleOverdueTasks } from "./taskHandlerService";
import { success } from "./toastService";
import { initializeApi, getEndpoint, processApiResponse, handleApiError } from "../utils/apiUtils";
import type { TodoistData } from "../types/todoist";

/**
 * Refreshes Todoist data.
 * @returns {Promise<{ status: "success"; data: TodoistData } | { status: "error"; error: TodoistRequestError | string }>} - Results of API refresh.
 */
export function refreshData(): Promise<
    | { status: "success"; data: TodoistData }
    | { status: "error"; error: TodoistRequestError | string }
> {
    const api = initializeApi(get(todoistAccessToken));
    if (!todoistAccessToken || !api) {
        const error = new TodoistRequestError("No access token found.");
        return Promise.resolve({ status: "error", error });
    }

    return Promise.all([
        api.getTasks({ limit: 200 }),
        api.getProjects(),
        getEndpoint(get(todoistAccessToken), "user"),
    ])
        .then((apiResult) => {
            const [tasks, projects, userResponse] = apiResult;

            if (!tasks || !projects || !userResponse) {
                const error = "Failed to fetch all required data.";
                return { status: "error", error: error } as const;
            }

            handleOverdueTasks(tasks.results || []);
            const todoistDataObj = processApiResponse(tasks, projects, userResponse);

            success("Todoist data updated!");
            return { status: "success", data: todoistDataObj } as const;
        })
        .catch((err) => {
            const error = handleApiError(err);
            return { status: "error", error } as const;
        });
}
