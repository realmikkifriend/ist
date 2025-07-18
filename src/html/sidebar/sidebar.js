import { get } from "svelte/store";
import { updateFirstDueTask } from "../../js/first.js";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../../js/stores.js";

export function clearSelectedContextId() {
    previousFirstDueTask.set(null);
    userSettings.update((settings) => ({ ...settings, selectedContextId: null }));
}

export function handleBadgeClick() {
    const $firstDueTask = get(firstDueTask);
    const $todoistData = get(todoistData);
    const selectedContextId = get(userSettings).selectedContextId;

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
    } else if (selectedContextId) {
        clearSelectedContextId();
    }
}
