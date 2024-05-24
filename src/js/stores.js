import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { fetchTodoistData } from "./api";
import { filterAndSortDueTasks } from "./filter";
import { success } from "./toasts";

export const todoistAccessToken = persisted("todoist_access_token", "");
export const todoistResources = persisted("todoist_resources", {});
export const todoistError = writable(null);

const resourceTypes = ["items", "projects", "notes"];

export async function refreshData() {
    let resources = {};
    let syncToken = "*";
    let error = null;
    let accessToken;

    todoistAccessToken.subscribe(($) => {
        accessToken = $;
    });

    if (!accessToken) {
        error = "No access token found.";
        todoistError.set(error);
        return { resources, error };
    }

    try {
        const data = await fetchTodoistData(resourceTypes, syncToken, accessToken);
        syncToken = data.sync_token;

        resourceTypes.forEach((type) => {
            resources[type] = data[type] || [];
        });
    } catch (err) {
        error = err.message;
    }

    if (error) {
        todoistError.set(error);
    } else {
        todoistResources.update(() => ({
            ...resources,
            dueTasks: filterAndSortDueTasks(resources.items),
        }));

        success("Todoist data updated!");
    }

    return { resources, error };
}
