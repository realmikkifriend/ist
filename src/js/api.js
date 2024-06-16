import { get } from "svelte/store";
import { v4 as uuidv4 } from "uuid";
import { todoistAccessToken, todoistResources, syncToken, todoistError } from "./stores";
import { filterAndSortDueTasks } from "./filter";
import { success } from "./toasts";
import { processTodoistData } from "./process";

export async function refreshData() {
    const RESOURCE_TYPES = ["items", "projects", "notes", "user"];
    let error = null,
        accessToken,
        currentResources = {},
        currentSyncToken;

    $: accessToken = get(todoistAccessToken);

    if (!accessToken) {
        error = "No access token found.";
        todoistError.set(error);
        return { resources: currentResources, error };
    }

    $: currentSyncToken = get(syncToken);

    try {
        const data = await fetchTodoistData(RESOURCE_TYPES, currentSyncToken, accessToken);
        syncToken.set(data.sync_token);

        $: currentResources = get(todoistResources) || {};

        currentResources = processTodoistData(currentResources, data, RESOURCE_TYPES);
    } catch (err) {
        error = err.message;
    }

    if (error) {
        todoistError.set(error);
    } else {
        const timeZone = currentResources.user?.tz_info?.timezone || "UTC";
        todoistResources.set({
            ...currentResources,
            dueTasks: filterAndSortDueTasks(
                currentResources.items,
                currentResources.contexts,
                timeZone,
            ),
        });

        success("Todoist data updated!");
    }

    return { resources: currentResources, error };
}

export async function fetchTodoistData(resourceTypes, syncToken, accessToken) {
    const response = await fetch("https://api.todoist.com/sync/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            sync_token: syncToken,
            resource_types: JSON.stringify(resourceTypes),
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

export async function markTaskDone(taskID, accessToken) {
    const response = await fetch("https://api.todoist.com/sync/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            commands: JSON.stringify([
                {
                    type: "item_close",
                    uuid: uuidv4(),
                    args: {
                        id: taskID,
                    },
                },
            ]),
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

export async function deferTasks(taskTimePairs, accessToken) {
    const commands = taskTimePairs.map(([task, time]) => {
        const taskNewDate =
            task.due.all_day === 1
                ? time.toFormat("yyyy-MM-dd")
                : time.toFormat("yyyy-MM-dd'T'HH:mm:ss");

        return {
            type: "item_update",
            uuid: uuidv4(),
            args: {
                id: task.id,
                due: {
                    date: taskNewDate,
                    datetime: taskNewDate,
                    string: task.due.string,
                },
            },
        };
    });

    const response = await fetch("https://todoist.com/api/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: new URLSearchParams({
            commands: JSON.stringify(commands),
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
