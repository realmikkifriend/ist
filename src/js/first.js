import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { todoistResources, userSettings, firstDueTask, previousFirstDueTask } from "../js/stores";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const setFirstDueTask = (task) => {
    firstDueTask.set(task);
    previousFirstDueTask.set(task);
};

const filterTasksByContext = (tasks, contextId) =>
    tasks.filter((task) => task.context_id === contextId);

const updateDueTasks = (dueTasks, contextId) => {
    if (contextId) {
        const filteredDueTasks = filterTasksByContext(dueTasks, contextId);
        if (!filteredDueTasks.length) {
            userSettings.update((settings) => ({ ...settings, selectedContextId: null }));
            success("No more tasks in context! Showing all due tasks...");
            return dueTasks;
        }
        return filteredDueTasks;
    }
    return dueTasks;
};

const updateTaskNotes = (task, notes) => {
    task.notes = notes.filter((note) => note.item_id === task.id);
    return task;
};

export const updateFirstDueTask = () => {
    const $resources = get(todoistResources);
    if (!$resources?.dueTasks?.length) {
        setFirstDueTask(null);
        return;
    }

    const contextId = get(userSettings).selectedContextId;
    const prevTask = get(previousFirstDueTask);

    let dueTasks = updateDueTasks($resources.dueTasks, contextId);

    const newTask = updateTaskNotes(dueTasks[0], $resources.notes);

    if (
        prevTask &&
        newTask.id !== prevTask.id &&
        (!contextId || prevTask.context_id === contextId) &&
        window.location.hash !== "#today" &&
        window.location.hash !== "#tomorrow"
    ) {
        newFirstTask(FirstDueTaskToast, () => setFirstDueTask(newTask));
    } else {
        toast.pop({ target: "wait" });
        setFirstDueTask(newTask);
    }
};
