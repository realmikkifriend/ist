import { get } from "svelte/store";
import { v4 as uuidv4 } from "uuid";
import { TodoistApi } from "@doist/todoist-api-typescript";
import {
    todoistAccessToken,
    todoistResources,
    todoistData,
    syncToken,
    todoistError,
} from "./stores";
import { filterAndSortDueTasks, getDueTasks } from "./filter";
import { success } from "./toasts";
import { processTodoistData, cleanTodoistData } from "./process";

const API_URL = "https://api.todoist.com/sync/v9/sync";
const CONTENT_TYPE = "application/x-www-form-urlencoded";
const accessToken = get(todoistAccessToken);

const api = new TodoistApi(accessToken);

export async function refreshData() {
    const RESOURCE_TYPES = ["items", "projects", "notes", "user"];
    let error = null;
    if (!accessToken) {
        return setErrorState("No access token found.", {});
    }

    const currentSyncToken = get(syncToken);
    try {
        const data = await executeAPICommand(
            {
                sync_token: currentSyncToken,
                resource_types: JSON.stringify(RESOURCE_TYPES),
            },
            accessToken,
        );
        syncToken.set(data.sync_token);

        let currentResources = get(todoistResources) || {};
        currentResources = processTodoistData(currentResources, data, RESOURCE_TYPES);
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";
        todoistResources.set({
            ...currentResources,
            dueTasks: filterAndSortDueTasks(
                currentResources.items,
                currentResources.contexts,
                timeZone,
            ),
        });
        success("Todoist data updated!");

        try {
            const [tasksResponse, projectsResponse, userResponse] = await Promise.all([
                api.getTasks({ limit: 200 }),
                api.getProjects(),
                getEndpoint("user", accessToken),
            ]);

            const cleanedData = cleanTodoistData({
                tasks: tasksResponse.results,
                contexts: projectsResponse.results,
                user: userResponse,
            });

            const dueTasks = getDueTasks(cleanedData);

            todoistData.set({ ...cleanedData, dueTasks });
        } catch (apiTsError) {
            console.error("Error fetching data with TodoistApi:", apiTsError);
        }

        return { resources: currentResources, error };
    } catch (err) {
        return setErrorState(err.message, {});
    }
}

export function setErrorState(error, currentResources) {
    todoistError.set(error);
    return { resources: currentResources, error };
}

export async function markTaskDone(taskID) {
    return await api.closeTask(taskID);
}

export async function deferTasks(taskTimePairs, accessToken) {
    const commands = taskTimePairs.map(([task, time]) => {
        const formattedDate = formatTaskDate(time);
        return {
            type: "item_update",
            uuid: uuidv4(),
            args: {
                id: task.id,
                due: {
                    date: formattedDate,
                    datetime: formattedDate,
                    string: task.due.string,
                },
            },
        };
    });

    return await executeAPICommand({ commands: JSON.stringify(commands) }, accessToken);
}

// export async function sendReorderedContexts(differences, accessToken) {
//     const commands = [
//         {
//             type: "project_reorder",
//             uuid: uuidv4(),
//             args: {
//                 projects: differences,
//             },
//         },
//     ];

//     return await executeAPICommand({ commands: JSON.stringify(commands) }, accessToken);
// }

async function executeAPICommand(params, accessToken) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": CONTENT_TYPE,
        },
        body: new URLSearchParams(params),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    return response.json();
}

async function getEndpoint(endpoint, accessToken, params = {}) {
    const response = await fetch(`https://api.todoist.com/api/v1/${endpoint}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": CONTENT_TYPE,
        },
        body: new URLSearchParams(params),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    return response.json();
}

function formatTaskDate(time) {
    return time.hour === 0 && time.minute === 0 && time.second === 0 && time.millisecond === 0
        ? time.toFormat("yyyy-MM-dd")
        : time.toFormat("yyyy-MM-dd'T'HH:mm:ss");
}
