import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistData } from "../stores/stores";
import { todoistAccessToken } from "../stores/secret";
import { handleOverdueTasks } from "./deferService";
import { success } from "./toastService";
import { initializeApi, getEndpoint, processApiResponse, handleApiError } from "../utils/apiUtils";

/**
 * Refreshes Todoist data and updates the store.
 * @returns {Promise<{ status: "success"; error: null } | { status: "error"; error: TodoistRequestError | string } | void>} - Results of API refresh.
 */
export function refreshData(): Promise<
    { status: "success"; error: null } | { status: "error"; error: TodoistRequestError | string }
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

            todoistData.set(todoistDataObj);
            success("Todoist data updated!");
            return { status: "success", error: null } as const;
        })
        .catch((err) => {
            const error = handleApiError(err);
            return { status: "error", error } as const;
        });
}
