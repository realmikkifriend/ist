import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { fetchTodoistData } from "./api";
import { filterAndSortDueTasks } from "./filter";
import { toast } from "@zerodevx/svelte-toast";

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

        toast.push("Todoist data updated!", {
            theme: {
                "--toastBarHeight": 0,
                "--toastColor": "mintcream",
                "--toastBackground": "rgba(72,187,120,0.9)",
            },
            duration: 1000,
            dismissable: false,
            intro: { y: 16000 },
        });
    }

    return { resources, error };
}
