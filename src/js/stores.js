import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { fetchTodoistData } from "./api";
import { filterAndSortDueTasks } from "./filter";
import { success } from "./toasts";

export const todoistAccessToken = persisted("todoist_access_token", "");
export const todoistResources = persisted("todoist_resources", {});
export const todoistError = writable(null);

const RESOURCE_TYPES = ["items", "projects", "notes", "user"];

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
        const data = await fetchTodoistData(RESOURCE_TYPES, syncToken, accessToken);
        syncToken = data.sync_token;

        RESOURCE_TYPES.forEach((type) => {
            if (type === "projects") {
                resources.contexts = data[type] || [];
            } else {
                resources[type] = data[type] || [];
            }
        });

        if (resources.items) {
            resources.items = resources.items.map((item) => ({
                ...item,
                context_id: item.project_id,
                project_id: undefined,
            }));
        }
    } catch (err) {
        error = err.message;
    }

    if (error) {
        todoistError.set(error);
    } else {
        const timeZone = resources.user?.tz_info?.timezone || "UTC";
        todoistResources.update(() => ({
            ...resources,
            dueTasks: filterAndSortDueTasks(resources.items, resources.contexts, timeZone),
        }));

        success("Todoist data updated!");
    }

    return { resources, error };
}
