import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { todoistData, todoistAccessToken } from "../stores/stores";
import { handleOverdueTasks } from "./deferService";
import { setErrorState, success } from "./toastService";
import { initializeApi, getEndpoint, processApiResponse, handleApiError } from "../utils/apiUtils";

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
