import { get } from "svelte/store";
import { todoistData } from "../stores/stores";
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
