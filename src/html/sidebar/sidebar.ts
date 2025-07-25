import { get } from "svelte/store";
import { updateFirstDueTask } from "../../js/first";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../../js/stores";
import type { Task, DueTasksGroupedByContext } from "../../../types/todoist";

/**
 * Groups due tasks by their context and counts priorities.
 * @returns {DueTasksGroupedByContext} An object mapping context IDs to task counts and priority breakdowns.
 */
export function getDueTasksGroupedByContext(): DueTasksGroupedByContext {
    const $todoistData = get(todoistData);
    return ($todoistData?.dueTasks ?? []).reduce((acc: DueTasksGroupedByContext, task: Task) => {
        const context = acc[task.contextId as string] ?? { total: 0, priorities: {} };
        context.total++;
        context.priorities[task.priority] = (context.priorities[task.priority] ?? 0) + 1;
        acc[task.contextId as string] = context;
        return acc;
    }, {} as DueTasksGroupedByContext);
}

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
function clearSelectedContext(): void {
    previousFirstDueTask.set(null);
    userSettings.update((settings) => ({ ...settings, selectedContext: null }));
}

/**
 * Handles the click event on the badge, updating navigation and state as needed.
 * @returns {void}
 */
export function handleBadgeClick(): void {
    const $firstDueTask = get(firstDueTask);
    const selectedContext = get(userSettings).selectedContext;

    if ($firstDueTask?.summoned) {
        window.location.hash = $firstDueTask.summoned as string;

        $firstDueTask.summoned = false;
        if ($firstDueTask.skip) {
            delete $firstDueTask.skip;
        }

        void updateFirstDueTask();
    } else if (selectedContext) {
        clearSelectedContext();
    }
}
