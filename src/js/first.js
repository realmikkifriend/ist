import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { firstDueTask, previousFirstDueTask } from "../js/stores";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const checkAndUpdateFirstDueTask = ($resources, selectedContextId, setSelectedContextId) => {
    if (!$resources?.dueTasks?.length) {
        previousFirstDueTask.set(null);
        firstDueTask.set(null);
        return;
    }

    let dueTasks = $resources.dueTasks;
    const oldPreviousFirstDueTask = get(previousFirstDueTask);

    if (selectedContextId) {
        const filteredDueTasks = dueTasks.filter((task) => task.context_id === selectedContextId);
        if (!filteredDueTasks.length) {
            setSelectedContextId(null);
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
        oldPreviousFirstDueTask &&
        currentFirstDueTask.id !== oldPreviousFirstDueTask.id &&
        (!selectedContextId || oldPreviousFirstDueTask.context_id === selectedContextId)
    ) {
        newFirstTask(FirstDueTaskToast, () => firstDueTask.set(currentFirstDueTask));
    } else {
        toast.pop({ target: "wait" });
        firstDueTask.set(currentFirstDueTask);
    }

    previousFirstDueTask.set(currentFirstDueTask);
};
