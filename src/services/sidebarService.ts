import type { Task } from "../types/todoist";
import type { UserSettings } from "../types/interface"; // Import UserSettings

/**
 * Gets the count of due tasks for a specific context.
 * @param {Task[]} dueTasks - The current due tasks.
 * @param {Task | null} firstDueTask - The first due task (used as a fallback for context if no selected context).
 * @param {UserSettings} userSettings - The user settings, containing the selected context.
 * @returns {number} The number of due tasks in the specified context.
 */
export function getDueTaskCountByContext(
    dueTasks: Task[],
    firstDueTask: Task | null,
    userSettings: UserSettings, // Add userSettings parameter
): number {
    const selectedContextId = userSettings.selectedContext?.id;

    if (selectedContextId) {
        const count = dueTasks.filter((task: Task) => task.contextId === selectedContextId).length;
        return count;
    } else if (firstDueTask?.contextId) {
        // Fallback to firstDueTask's context if no specific context is selected
        const count = dueTasks.filter(
            (task: Task) => task.contextId === firstDueTask.contextId,
        ).length;
        return count;
    }
    // If no context is selected and no firstDueTask context, return total due tasks
    return dueTasks.length;
}
