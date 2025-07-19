import { get } from "svelte/store";
import { updateFirstDueTask } from "../../js/first.js";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../../js/stores.js";

export function getDueTasksGroupedByContext() {
    const $todoistData = get(todoistData);
    return ($todoistData?.dueTasks ?? []).reduce((acc, task) => {
        const context = acc[task.contextId] ?? { total: 0, priorities: {} };
        context.total++;
        context.priorities[task.priority] = (context.priorities[task.priority] ?? 0) + 1;
        acc[task.contextId] = context;
        return acc;
    }, {});
}

export function getDueTaskCountByContext(contextId) {
    const $todoistData = get(todoistData);
    if ($todoistData?.dueTasks && contextId) {
        return $todoistData.dueTasks.filter((task) => task.contextId === contextId).length;
    }
    return 0;
}

function clearSelectedContext() {
    previousFirstDueTask.set(null);
    userSettings.update((settings) => ({ ...settings, selectedContext: null }));
}

export function handleBadgeClick() {
    const $firstDueTask = get(firstDueTask);
    const $todoistData = get(todoistData);
    const selectedContext = get(userSettings).selectedContext;

    if ($firstDueTask?.summoned) {
        window.location.hash = $firstDueTask.summoned;

        $firstDueTask.summoned = false;
        if ($firstDueTask.skip) {
            delete $firstDueTask.skip;
            if ($todoistData && typeof todoistData.update === "function") {
                todoistData.update((data) => ({ ...data, reverseTasks: [] }));
            }
        }

        updateFirstDueTask();
    } else if (selectedContext) {
        clearSelectedContext();
    }
}
