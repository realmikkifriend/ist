import { get } from "svelte/store";
import { todoistData, previousFirstDueTask } from "../stores/stores";
import { userSettings } from "../stores/interface";
import { success } from "../services/toastService";
import { filterTasksByContext } from "../utils/firstTaskUtils";
import type { Task } from "../types/todoist";
import type { UserSettings } from "../types/interface";

/**
 * Gets the count of due tasks for a specific context.
 * @param {string} contextId - The ID of the context to count tasks for.
 * @returns {number} The number of due tasks in the specified context.
 */
export function getDueTaskCountByContext(contextId: string): number {
    const $todoistData = get(todoistData);
    if ($todoistData?.dueTasks && contextId) {
        return $todoistData.dueTasks.filter((task: Task) => task.contextId === contextId).length;
    }
    return 0;
}

/**
 * Clears the selected context and previous first due task.
 * @returns {void}
 */
export function clearSelectedContext(): void {
    previousFirstDueTask.set(null);
    userSettings.update((settings: UserSettings) => ({ ...settings, selectedContext: null }));
    success("No more tasks in context! Showing all due tasks...");
}

/**
 * Update due tasks based on the selected context ID.
 * @param {Task[]} dueTasks - The list of due tasks.
 * @param {string | null} contextId - The selected context ID from settings.
 * @returns {Task[]} The updated list of due tasks.
 */
export const updateDueTasks = (dueTasks: Task[], contextId: string | null): Task[] => {
    if (contextId) {
        const filteredDueTasks = filterTasksByContext(dueTasks, contextId);
        if (!filteredDueTasks.length) {
            userSettings.update((settings: UserSettings) => ({
                ...settings,
                selectedContext: null,
            }));
            success("No more tasks in context! Showing all due tasks...");
            return dueTasks;
        }
        return filteredDueTasks;
    }
    return dueTasks;
};

/**
 * Closes the sidebar drawer by unchecking the drawer checkbox.
 */
export function closeSidebar(): void {
    const drawerCheckbox = document.getElementById("my-drawer") as HTMLInputElement | null;
    if (drawerCheckbox) {
        drawerCheckbox.checked = false;
    }
}
