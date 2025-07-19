import { get } from "svelte/store";
import { TodoistApi } from "@doist/todoist-api-typescript";
import { todoistAccessToken, todoistData, todoistError } from "./stores";
import { getDueTasks } from "./filter";
import { success } from "./toasts";
import { cleanTodoistData } from "./process";

let accessToken;
let api;

function initializeApi() {
    accessToken = get(todoistAccessToken);
    if (accessToken) {
        api = new TodoistApi(accessToken);
    } else {
        api = null;
    }
}

export async function refreshData() {
    initializeApi();
    if (!accessToken) {
        return setErrorState("No access token found.", {});
    }

    try {
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

        success("Todoist data updated!");

        return { status: "success", error: null };
    } catch (err) {
        return setErrorState(err.message, {});
    }
}

export function setErrorState(error) {
    todoistError.set(error);
    return { status: "error", error };
}

export async function getTaskComments(taskId) {
    initializeApi();
    if (!accessToken) {
        return setErrorState("No access token found.", {});
    }

    try {
        const comments = await api.getComments({ taskId });
        return comments;
    } catch (error) {
        return setErrorState(error.message, {});
    }
}

export async function markTaskDone(taskID) {
    initializeApi();
    if (!accessToken) {
        return setErrorState("No access token found.", {});
    }

    return await api.closeTask(taskID);
}

export async function deferTasks(taskTimePairs) {
    initializeApi();
    if (!accessToken) {
        return setErrorState("No access token found.", {});
    }

    const updatePromises = taskTimePairs.map(([task, time]) => {
        const formattedDate = formatTaskDate(time);
        return api.updateTask(task.id, {
            due_date: formattedDate,
            due_datetime: formattedDate,
            due_string: task.due.string,
        });
    });

    return Promise.all(updatePromises);
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

async function getEndpoint(endpoint, accessToken, params = {}) {
    const CONTENT_TYPE = "application/x-www-form-urlencoded";
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
