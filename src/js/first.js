import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { todoistResources, userSettings, firstDueTask, previousFirstDueTask } from "../js/stores";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const updateFirstDueTask = () => {
    const $resources = get(todoistResources);
    if (!$resources?.dueTasks?.length) {
        previousFirstDueTask.set(null);
        firstDueTask.set(null);
        return;
    }

    const selectedContextId = get(userSettings).selectedContextId;
    const prevFirstDueTask = get(previousFirstDueTask);
    let dueTasks = $resources.dueTasks;

    if (selectedContextId) {
        const filteredDueTasks = dueTasks.filter((task) => task.context_id === selectedContextId);
        if (!filteredDueTasks.length) {
            userSettings.update((settings) => ({ ...settings, selectedContextId: null }));
            success("No more tasks in context! Showing all due tasks...");
        } else {
            dueTasks = filteredDueTasks;
        }
    }

    const currentFirstDueTask = dueTasks[0];
    currentFirstDueTask.notes = $resources.notes.filter(
        (note) => note.item_id === currentFirstDueTask.id,
    );

    if (
        prevFirstDueTask &&
        currentFirstDueTask.id !== prevFirstDueTask.id &&
        (!selectedContextId || prevFirstDueTask.context_id === selectedContextId)
    ) {
        newFirstTask(FirstDueTaskToast, () => firstDueTask.set(currentFirstDueTask));
    } else {
        toast.pop({ target: "wait" });
        firstDueTask.set(currentFirstDueTask);
    }

    previousFirstDueTask.set(currentFirstDueTask);
};
