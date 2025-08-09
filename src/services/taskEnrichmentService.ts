import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistAccessToken } from "../stores/secret";
import { getActivity } from "./activityService";
import { loadCommentsForTask } from "../utils/firstTaskUtils";
import type { TodoistData, Task, InitialCheckOutcome } from "../types/todoist";
import type { TaskActivity } from "../types/activity";

/**
 * Handles initial checks and early exits for updateFirstDueTask.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @param {TodoistData} $todoistData - The current Todoist data.
 * @param {Task | null} prevTask - The previously set first due task.
 * @returns {InitialCheckOutcome} An object indicating the outcome of the checks.
 */
export const handleInitialChecks = (
    task: Task | null,
    $todoistData: TodoistData,
    prevTask: Task | null,
): InitialCheckOutcome => {
    if (task) {
        const taskWithData = loadActivityForTask(
            loadCommentsForTask(task, get(todoistAccessToken)),
        );
        return { action: "set_task_and_continue", taskToSet: taskWithData };
    }

    if (prevTask?.summoned && !task) {
        return { action: "exit" };
    }

    if (!$todoistData?.dueTasks?.length) {
        return { action: "set_task_and_exit", taskToSet: null };
    }
    return { action: "continue" };
};

/**
 * Loads activity for a given task.
 * @param {Task} task - The task to load activity for.
 * @returns {Task} The task with the activity loaded.
 */
export const loadActivityForTask = (task: Task): Task => {
    const activity = getActivity([DateTime.now().minus({ years: 1 }), DateTime.now()], task) as {
        data: TaskActivity[];
        promise: Promise<TaskActivity[]>;
    };

    return {
        ...task,
        activity: activity.promise ?? activity.data,
    };
};
