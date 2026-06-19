import { get } from "svelte/store";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import { DateTime } from "luxon";
import { todoistAccessToken } from "../stores/secret";
import { handleOverdueTasks } from "./taskHandlerService";
import { success } from "./toastService";
import { initializeApi, getEndpoint, processApiResponse, handleApiError } from "../utils/apiUtils";
import { getDueTasks, getReverseTasks } from "../utils/filterUtils";
import type { TodoistData, Task, TaskUpdates } from "../types/todoist";

/**
 * Applies overdue task updates to the Todoist data.
 * @param {TodoistData} data - The current Todoist data.
 * @param {TaskUpdates} updates - The updates to apply.
 * @returns {TodoistData} - The updated Todoist data.
 */
function applyOverdueUpdates(data: TodoistData, updates: TaskUpdates): TodoistData {
    const updatedTasks = data.tasks.map((task) => {
        const update = updates.find(([id]) => id === task.id);
        if (update) {
            const [, dateValue] = update;
            const dt =
                dateValue instanceof DateTime
                    ? dateValue
                    : dateValue instanceof Date
                      ? DateTime.fromJSDate(dateValue)
                      : DateTime.fromISO(dateValue);

            return {
                ...task,
                due: {
                    ...task.due!,
                    date: dt.toISODate()!,
                    string: dt.toFormat("yyyy-MM-dd"),
                    dateObject: dt.toJSDate(),
                },
            };
        }
        return task;
    });

    const result = { ...data, tasks: updatedTasks };
    result.dueTasks = getDueTasks(result);
    const reverseTasksTomorrow = getReverseTasks(result);
    const now = new Date();
    const reverseTasksToday = reverseTasksTomorrow.filter((task: Task) => {
        if (!task.due || !(task.due.dateObject instanceof Date)) return false;
        return task.due.dateObject.toDateString() === now.toDateString();
    });
    result.reverseTasks = {
        tomorrow: reverseTasksTomorrow,
        today: reverseTasksToday,
    };
    return result;
}

/**
 * Refreshes Todoist data.
 * @returns {Promise<{ status: "success"; data: TodoistData } | { status: "error"; error: TodoistRequestError | string }>} - Results of API refresh.
 */
export function refreshData(): Promise<
    | { status: "success"; data: TodoistData }
    | { status: "error"; error: TodoistRequestError | string }
> {
    const api = initializeApi(get(todoistAccessToken));
    if (!todoistAccessToken || !api) {
        return Promise.resolve(handleApiError("No access token found."));
    }

    return Promise.all([
        api.getTasks({ limit: 200 }),
        api.getProjects(),
        getEndpoint(get(todoistAccessToken), "user"),
    ])
        .then(async (apiResult) => {
            const [tasks, projects, userResponse] = apiResult;

            if (!tasks || !projects || !userResponse) {
                const error = "Failed to fetch all required data.";
                return { status: "error", error: error } as const;
            }

            const overdueUpdates = await handleOverdueTasks(tasks.results || []);
            const todoistDataObj = processApiResponse(tasks, projects, userResponse);

            if (overdueUpdates) {
                const updatedData = applyOverdueUpdates(todoistDataObj, overdueUpdates);
                success("Todoist data updated!");
                return { status: "success", data: updatedData } as const;
            }

            success("Todoist data updated!");
            return { status: "success", data: todoistDataObj } as const;
        })
        .catch(handleApiError);
}
