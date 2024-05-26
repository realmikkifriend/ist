import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { fetchTodoistData } from "./api";
import { filterAndSortDueTasks } from "./filter";
import { success } from "./toasts";

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

        if (data.full_sync) {
            RESOURCE_TYPES.forEach((type) => {
                if (type === "projects") {
                    currentResources.contexts = data[type] || [];
                } else if (type === "user") {
                    currentResources[type] = data[type];
                } else {
                    currentResources[type] = data[type] || [];
                }
            });

            if (currentResources.items) {
                currentResources.items = currentResources.items.map((item) => ({
                    ...item,
                    context_id: item.project_id,
                    project_id: undefined,
                }));
            }
        } else {
            RESOURCE_TYPES.forEach((type) => {
                if (type === "items" && data[type]) {
                    const newItemsMap = new Map(data[type].map((item) => [item.id, item]));
                    currentResources.items = (currentResources.items || []).map((item) => {
                        if (newItemsMap.has(item.id)) {
                            const newItem = newItemsMap.get(item.id);
                            return {
                                ...newItem,
                                context_id: newItem.project_id,
                                project_id: undefined,
                            };
                        }
                        return item;
                    });
                    data[type].forEach((item) => {
                        if (!newItemsMap.has(item.id)) {
                            currentResources.items.push({
                                ...item,
                                context_id: item.project_id,
                                project_id: undefined,
                            });
                        }
                    });
                } else if (type === "user" && data[type]) {
                    currentResources[type] = data[type];
                } else if (data[type]) {
                    currentResources[type] = [...(currentResources[type] || []), ...data[type]];
                }
            });
        }
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
