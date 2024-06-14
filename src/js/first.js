import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { firstDueTask } from "../js/stores";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const checkAndUpdateFirstDueTask = (
    $resources,
    previousFirstDueTask,
    setPreviousFirstDueTask,
    selectedContextId,
    setSelectedContextId,
) => {
    if (!$resources || !$resources.dueTasks) return;

    let dueTasks = $resources.dueTasks;

    if (selectedContextId) {
        const filteredDueTasks = dueTasks.filter((task) => task.context_id === selectedContextId);

        if (!filteredDueTasks || filteredDueTasks.length === 0) {
            setSelectedContextId(null);
            success("No more tasks in context! Showing all due tasks...");
        } else {
            dueTasks = filteredDueTasks;
        }
    }

    if (!dueTasks || dueTasks.length === 0) {
        return;
    }

    const currentFirstDueTask = dueTasks[0];

    let firstDueTaskComments = $resources.notes.filter(
        (note) => note.item_id === currentFirstDueTask.id,
    );

    currentFirstDueTask.notes = firstDueTaskComments;

    if (
        previousFirstDueTask &&
        currentFirstDueTask?.id !== previousFirstDueTask?.id &&
        (selectedContextId === null || previousFirstDueTask.context_id === selectedContextId)
    ) {
        const onClickHandler = () => {
            firstDueTask.set(currentFirstDueTask);
        };
        newFirstTask(FirstDueTaskToast, onClickHandler);
    } else {
        toast.pop({ target: "wait" });
        firstDueTask.set(currentFirstDueTask);
    }

    setPreviousFirstDueTask(currentFirstDueTask);
};
