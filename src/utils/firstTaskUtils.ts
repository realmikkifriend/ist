import { getTaskComments } from "./apiUtils";
import type { Task, TodoistData } from "../types/todoist";
import type { UserSettings } from "../types/interface";

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

/**
 * Get the context name from provided data.
 * @param {TodoistData | null | undefined} todoistDataValue - The value of the todoistData store.
 * @param {Task | null} firstDueTaskValue - The value of the firstDueTask store.
 * @returns - The context name, or an empty string if not found.
 */
function findContextNameFromTodoistData(
    todoistDataValue: TodoistData | null | undefined,
    firstDueTaskValue: Task | null,
): string | null {
    if (todoistDataValue?.contexts && firstDueTaskValue?.contextId) {
        const context = todoistDataValue.contexts.find((c) => c.id === firstDueTaskValue.contextId);
        if (context && typeof context.name === "string") {
            return context.name;
        }
    }
    return null;
}

/**
 * Get the name of the current context, either from user settings or from the first due task's context.
 * @param {TodoistData | null | undefined} todoistDataValue - The value of the todoistData store.
 * @param {UserSettings | null | undefined} userSettingsValue - The value of the userSettings store.
 * @param {Task | null} firstDueTaskValue - The value of the firstDueTask store.
 * @returns - The context name, or an empty string if not found.
 */
export function getSelectedContextName(
    todoistDataValue: TodoistData | null | undefined,
    userSettingsValue: UserSettings | null | undefined,
    firstDueTaskValue: Task | null,
): string {
    if (userSettingsValue?.selectedContext?.name) {
        return userSettingsValue.selectedContext.name;
    }

    const contextNameFromTodoist = findContextNameFromTodoistData(
        todoistDataValue,
        firstDueTaskValue,
    );

    if (contextNameFromTodoist) {
        return contextNameFromTodoist;
    }

    return "";
}

/**
 * Loads comments for a given task and attaches them.
 * @param {Task} task - The task to load comments for.
 * @param {string} todoistAccessTokenValue - The value of the todoistAccessToken store.
 * @returns The task with a promise for the comments.
 */
export const loadCommentsForTask = async (
    task: Task,
    todoistAccessTokenValue: string,
): Promise<Task> => {
    const comments = await getTaskComments(todoistAccessTokenValue, task.id);
    return { ...task, comments };
};
