import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistAccessToken } from "../stores/secret";
import { getActivity } from "./activityService";
import { loadCommentsForTask } from "../utils/firstTaskUtils";
import type { TodoistData, Task, InitialCheckOutcome } from "../types/todoist";
import { firstDueTask } from "../stores/stores";

/**
 * Handles initial checks and early exits for updateFirstDueTask.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @param {TodoistData} $todoistData - The current Todoist data.
 * @param {Task | null} prevTask - The previously set first due task.
 * @param {ReturnType<typeof setTimeout> | null} debounceTimeoutId - The current debounce timeout ID.
 * @returns {Promise<InitialCheckOutcome>} An object indicating the outcome of the checks.
 */
export const handleInitialChecks = async (
    task: Task | null,
    $todoistData: TodoistData,
    prevTask: Task | null,
    debounceTimeoutId: ReturnType<typeof setTimeout> | null,
): Promise<InitialCheckOutcome> => {
    if (task) {
        const taskWithData = await loadActivityForTask(
            loadCommentsForTask(task, get(todoistAccessToken)),
        );
        return {
            action: "set_task_and_continue",
            taskToSet: taskWithData,
            showNewTaskToast: false,
        };
    }

    if (prevTask?.summoned && !task) {
        return { action: "exit", showNewTaskToast: false };
    }

    if (!$todoistData?.dueTasks?.length) {
        return { action: "set_task_and_exit", taskToSet: null, showNewTaskToast: false };
    }

    if (debounceTimeoutId) {
        return { action: "exit", taskToSet: get(firstDueTask), showNewTaskToast: false };
    }

    return { action: "continue", showNewTaskToast: false };
};

/**
 * Loads activity for a given task.
 * @param {Promise<Task>} taskPromise - The promised task.
 * @returns {Task} The task with the activity loaded.
 */
export const loadActivityForTask = async (taskPromise: Promise<Task>): Promise<Task> => {
    const task = await taskPromise;
    const activity = getActivity([DateTime.now().minus({ years: 1 }), DateTime.now()], task);

    const activityPromise = activity.promise
        ? activity.promise.then(({ relevant }) => relevant)
        : Promise.resolve(activity.data);

    return {
        ...task,
        activity: activityPromise,
    };
};
