import { get } from "svelte/store";
import { todoistData } from "../stores/stores";
import { filterTasksByContext } from "../utils/firstTaskUtils";
import type { Task } from "../types/todoist";

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
 * Update due tasks based on the selected context ID.
 * @param {Task[]} dueTasks - The list of due tasks.
 * @param {string | null} contextId - The selected context ID from settings.
 * @returns {{tasks: Task[], contextCleared: boolean}} The updated list of due tasks and a flag indicating if the context was cleared.
 */
export const updateDueTasks = (
    dueTasks: Task[],
    contextId: string | null,
): { tasks: Task[]; contextCleared: boolean } => {
    if (contextId) {
        const filteredDueTasks = filterTasksByContext(dueTasks, contextId);
        if (!filteredDueTasks.length) {
            return { tasks: dueTasks, contextCleared: true };
        }
        return { tasks: filteredDueTasks, contextCleared: false };
    }
    return { tasks: dueTasks, contextCleared: false };
};
