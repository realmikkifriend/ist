import { get } from "svelte/store";
import { DateTime } from "luxon";
import { firstDueTask } from "../stores/stores";
import { todoistAccessToken } from "../stores/secret";
import { getActivity } from "./activityService";
import { loadCommentsForTask } from "../utils/firstTaskUtils";
import type { TodoistData, Task, InitialCheckOutcome } from "../types/todoist";

/**
 * Enriches a task by loading its comments and activity.
 * @param {Task} task - The task to enrich.
 * @param {string} accessToken - The Todoist access token.
 * @returns {Promise<Task>} The enriched task.
 */
export const enrichTask = async (task: Task, accessToken: string): Promise<Task> => {
    const taskWithComments = await loadCommentsForTask(task, accessToken);
    const activity = getActivity(
        [DateTime.now().minus({ years: 1 }), DateTime.now()],
        taskWithComments,
    );

    const activityPromise = activity.promise
        ? activity.promise.then(({ relevant }) => relevant)
        : Promise.resolve(activity.data);

    return {
        ...taskWithComments,
        activity: activityPromise,
    };
};

/**
 * Handles initial checks and early exits for updateFirstDueTask.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @param {TodoistData} $todoistData - The current Todoist data.
 * @param {ReturnType<typeof setTimeout> | null} debounceTimeoutId - The current debounce timeout ID.
 * @returns {Promise<InitialCheckOutcome>} An object indicating the outcome of the checks.
 */
export const handleInitialChecks = async (
    task: Task | null,
    $todoistData: TodoistData,
    debounceTimeoutId: ReturnType<typeof setTimeout> | null,
): Promise<InitialCheckOutcome> => {
    if (task) {
        const taskWithData = await enrichTask(task, get(todoistAccessToken));
        return {
            action: "set_task_and_continue",
            taskToSet: taskWithData,
            showNewTaskToast: true,
        };
    }

    if (!$todoistData?.dueTasks?.length) {
        return { action: "set_task_and_exit", taskToSet: null, showNewTaskToast: false };
    }

    if (debounceTimeoutId) {
        return { action: "exit", taskToSet: get(firstDueTask), showNewTaskToast: false };
    }

    return { action: "continue", showNewTaskToast: true };
};
