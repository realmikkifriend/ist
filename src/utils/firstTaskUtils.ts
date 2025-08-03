import type { Task } from "../types/todoist";

/**
 * Filter task list by context.
 * @param {Task[]} tasks - The list of tasks to filter.
 * @param {string} contextId - The context ID to filter by.
 * @returns {Task[]} The filtered list of tasks.
 */
export const filterTasksByContext = (tasks: Task[], contextId: string): Task[] =>
    tasks.filter((task) => task.contextId === contextId);

/**
 * Determines whether to show a toast notification for a new task.
 * @param {Task} newTask - The new first-due task.
 * @param {Task | null} prevTask - The previous task.
 * @param {string | null} selectedContextId - The currently selected context ID.
 * @returns True if a toast should be shown, false otherwise.
 */
export const shouldShowNewTaskToast = (
    newTask: Task,
    prevTask: Task | null,
    selectedContextId: string | null,
): boolean => {
    return (
        prevTask !== null &&
        newTask.id !== prevTask.id &&
        (!selectedContextId || prevTask.contextId === selectedContextId) &&
        window.location.hash !== "#today" &&
        window.location.hash !== "#tomorrow"
    );
};
