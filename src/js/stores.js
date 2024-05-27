import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { fetchTodoistData } from "./api";
import { filterAndSortDueTasks } from "./filter";
import { success } from "./toasts";
import { processTodoistData } from "./process";

export const todoistAccessToken = persisted("todoist_access_token", "");
export const todoistResources = persisted("todoist_resources", {});
export const todoistError = writable(null);
export const syncToken = persisted("sync_token", "*");
export const userSettings = persisted("user_settings", {
    selectedContextId: null,
});
export const firstDueTask = persisted("firstDueTask", null);

const RESOURCE_TYPES = ["items", "projects", "notes", "user"];

export async function refreshData() {
    let error = null;
    let accessToken;
    let currentResources = {};

    todoistAccessToken.subscribe(($) => {
        accessToken = $;
    });

    if (!accessToken) {
        error = "No access token found.";
        todoistError.set(error);
        return { resources: currentResources, error };
    }

    let currentSyncToken;
    syncToken.subscribe(($) => {
        currentSyncToken = $;
    });

    try {
        const data = await fetchTodoistData(RESOURCE_TYPES, currentSyncToken, accessToken);
        syncToken.set(data.sync_token);

        todoistResources.subscribe(($) => {
            currentResources = $ || {};
        });

        currentResources = processTodoistData(currentResources, data, RESOURCE_TYPES);
    } catch (err) {
        error = err.message;
    }

    if (error) {
        todoistError.set(error);
    } else {
        const timeZone = currentResources.user?.tz_info?.timezone || "UTC";
        todoistResources.update(() => ({
            ...currentResources,
            dueTasks: filterAndSortDueTasks(
                currentResources.items,
                currentResources.contexts,
                timeZone,
            ),
        }));

        success("Todoist data updated!");
    }

    return { resources: currentResources, error };
}
