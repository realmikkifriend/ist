import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../js/stores";
import { getTaskComments } from "../js/api";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";

export const setFirstDueTask = (task) => {
    firstDueTask.set(task);
    previousFirstDueTask.set(task);
};

const filterTasksByContext = (tasks, contextId) =>
    tasks.filter((task) => task.contextId === contextId);

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

const loadComments = async (taskId) => {
    const comments = (await getTaskComments(taskId))?.results || [];
    return comments;
};

export const updateFirstDueTask = async () => {
    const $todoistData = get(todoistData);
    if (!$todoistData?.dueTasks?.length) {
        setFirstDueTask(null);
        return;
    }

    const contextId = get(userSettings).selectedContextId;
    const prevTask = get(previousFirstDueTask);

    let dueTasks = updateDueTasks($todoistData.dueTasks, contextId);

    const newTask = dueTasks[0];

    const comments = await loadComments(newTask.id);
    newTask.comments = comments;

    if (
        prevTask &&
        newTask.id !== prevTask.id &&
        (!contextId || prevTask.contextId === contextId) &&
        window.location.hash !== "#today" &&
        window.location.hash !== "#tomorrow"
    ) {
        newFirstTask(FirstDueTaskToast, () => setFirstDueTask(newTask));
    } else {
        toast.pop({ target: "wait" });
        setFirstDueTask(newTask);
    }
};
