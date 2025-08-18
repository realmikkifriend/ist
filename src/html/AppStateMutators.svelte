<script lang="ts">
    import { setContext } from "svelte";
    import {
        todoistData,
        firstDueTask,
        previousFirstDueTask,
        taskActivity,
    } from "../stores/stores";
    import { userSettings } from "../stores/interface";
    import { calculateUpdatedTaskResources } from "../utils/processUtils";
    import { newFirstTask, clearToasts } from "../services/toastService";
    import AppMethods from "./AppMethods.svelte";
    import type { Task, UpdateFirstDueTaskResult, TaskUpdates } from "../types/todoist";
    import type { TaskActivity } from "../types/activity";
    import type { AppStateMutatorsContext } from "../types/methods";

    /**
     * Changes the selected context in user settings.
     * @param context - The context to set, or null to clear.
     */
    const changeSelectedContext = (context: { id: string; name: string } | null): void => {
        userSettings.update((settings) => ({ ...settings, selectedContext: context }));
    };

    /**
     * Sets the first due task and the previous first due task.
     * @param task - The task to set.
     */
    const setTask = (task: Task | null): void => {
        firstDueTask.set(task);
        previousFirstDueTask.set(task);
    };

    /**
     * Clears the previous first due task.
     */
    const clearPreviousFirstDueTask = (): void => {
        previousFirstDueTask.set(null);
    };

    /**
     * Updates the todoistData store with new task resources.
     * @param taskUpdates - Array of tasks that have been updated.
     * @param deletedTaskIds - Array of task IDs that have been deleted.
     */
    const updateTodoistDataResources = (
        taskUpdates: TaskUpdates = [],
        deletedTaskIds: string[] = [],
    ): void => {
        todoistData.set(calculateUpdatedTaskResources($todoistData, taskUpdates, deletedTaskIds));
    };

    /**
     * Handles data updates from fetching the first due task.
     * @param updatedTodoistData - The data to be updated.
     * @param doClearContext - Whether to clear the selected context.
     */
    const handleDataUpdates = (
        updatedTodoistData: UpdateFirstDueTaskResult["updatedTodoistData"],
        doClearContext: boolean,
    ): void => {
        if (updatedTodoistData) {
            todoistData.set(updatedTodoistData);
        }

        if (doClearContext) {
            changeSelectedContext(null);
        }
    };

    /**
     * Adds a new task activity entry to the store.
     * @param newActivityEntry - The new activity to add to entries.
     */
    const addTaskActivityEntry = (newActivityEntry: TaskActivity): void => {
        taskActivity.update((activities) => [...activities, newActivityEntry]);
    };

    /**
     * Handles displaying the task.
     * @param task - The task to display.
     * @param showNewTaskToast - Whether to show a new task toast.
     */
    const handleTaskDisplay = (task: Task | null, showNewTaskToast: boolean): void => {
        if (!task) {
            setTask(null);
            return;
        }

        if (showNewTaskToast && task.id !== $firstDueTask?.id) {
            newFirstTask((t) => setTask(t), task);
        } else {
            setTask(task);
            clearToasts(undefined, "info");
        }
    };

    setContext("appStateMutators", {
        changeSelectedContext,
        setTask,
        clearPreviousFirstDueTask,
        updateTodoistDataResources,
        handleDataUpdates,
        addTaskActivityEntry,
        handleTaskDisplay,
    }) as AppStateMutatorsContext;
</script>

<AppMethods />
