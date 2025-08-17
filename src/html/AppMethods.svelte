<script lang="ts">
    import { onMount, setContext } from "svelte";
    import { on } from "svelte/events";
    import {
        todoistData,
        firstDueTask,
        todoistError,
        previousFirstDueTask,
    } from "../stores/stores";
    import { userSettings, hashStore } from "../stores/interface";
    import { debounceState } from "../services/firstTaskService";
    import { updateFirstDueTask, skipTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import { newFirstTask, clearToasts, success } from "../services/toastService";
    import { calculateUpdatedTaskResources } from "../utils/processUtils";
    import AppCompose from "./AppCompose.svelte";
    import type { Task, UpdateFirstDueTaskResult, TaskUpdates } from "../types/todoist";
    import type { TaskActivity } from "../types/activity";
    import { taskActivity } from "../stores/stores";

    let isSpinning = $state(false);

    $effect(() => {
        if ($userSettings.selectedContext || $todoistData.dueTasks) {
            void updateDisplayedTask();
        }
    });

    /**
     * Refreshes Todoist data and manages the spinning state.
     * @returns Promise that resolves when data is refreshed and spinning state is updated.
     */
    const handleRefresh = async (): Promise<void> => {
        isSpinning = true;
        const result = await refreshData();
        if (result.status === "success") {
            todoistData.set(result.data);
        } else {
            todoistError.set(
                typeof result.error === "string" ? result.error : result.error.message,
            );
        }
        isSpinning = false;
    };

    let dataPromise: Promise<void> = $state(
        $firstDueTask?.summoned ? Promise.resolve() : handleRefresh(),
    );

    const handleClearSelectedTask = async (): Promise<void> => {
        debounceState.clearDebounceTimeout();
        const selectedContext = $userSettings.selectedContext;
        const summoned = $firstDueTask?.summoned;

        if (summoned) {
            window.location.hash = summoned as string;
        }

        if (summoned || selectedContext) {
            if (selectedContext) {
                changeSelectedContext(null);
                success("No more tasks in context! Showing all due tasks...");
            }
            await updateDisplayedTask();
        }
    };

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

    /**
     * Updates the displayed task.
     * @returns Promise that resolves when the task is updated.
     */
    const updateDisplayedTask = async (): Promise<void> => {
        const { task, showNewTaskToast, doClearContext, updatedTodoistData } =
            await updateFirstDueTask();

        handleDataUpdates(updatedTodoistData, doClearContext);
        handleTaskDisplay(task, showNewTaskToast);
    };

    /**
     * Handles clicking on a context button.
     * Updates the selected context in user settings.
     * @param contextId - The ID of the context that was clicked.
     */
    function handleContextChange(contextId: string | null): void {
        debounceState.clearDebounceTimeout();

        previousFirstDueTask.set(null);
        const isCurrentlySelected = $userSettings.selectedContext?.id === contextId;
        const newSelectedContext = isCurrentlySelected
            ? null
            : contextId
              ? {
                    id: contextId,
                    name: $todoistData.contexts.find((c) => c.id === contextId)?.name || "",
                }
              : null;

        changeSelectedContext(newSelectedContext);
    }

    /**
     * Handles skipping the current task.
     */
    const handleSkipTask = (): void => {
        if ($firstDueTask) {
            void skipTask($firstDueTask).then(async (skipResult) => {
                if (skipResult.task) {
                    await summonTask(skipResult.task, true);
                    void updateDisplayedTask();
                } else {
                    void updateDisplayedTask();
                }
            });
        }
    };

    /**
     * Performs the summon action for a task.
     * @param task - The task to summon.
     * @param enableSkip - Whether to enable skip.
     * @returns The result of updating the first due task.
     */
    async function performSummon(
        task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
        enableSkip: boolean,
    ): Promise<UpdateFirstDueTaskResult> {
        debounceState.clearDebounceTimeout();
        if (enableSkip) {
            task.skip = true;
        }
        const currentFirstDueSummoned = $firstDueTask?.summoned;

        task.summoned = currentFirstDueSummoned || window.location.hash;

        const result = await updateFirstDueTask(task);
        firstDueTask.set(result.task);
        previousFirstDueTask.set(result.task);
        return result;
    }

    /**
     * Summon a task as the first due task.
     * @param task - The task to summon.
     * @param enableSkip - Whether to enable skip. Defaults to false.
     * @returns The summoned task.
     */
    export async function summonTask(
        task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
        enableSkip: boolean = false,
    ): Promise<UpdateFirstDueTaskResult> {
        if (!task.firstDue || enableSkip) {
            return performSummon(task, enableSkip);
        }
        return {
            task: $firstDueTask,
            showNewTaskToast: false,
            doClearContext: false,
            dueTasks: $todoistData.dueTasks,
        };
    }

    setContext("methods", {
        handleRefresh,
        handleClearSelectedTask,
        handleContextChange,
        updateDisplayedTask,
        handleSkipTask,
        summonTask,
        clearPreviousFirstDueTask,
        updateTodoistDataResources,
        addTaskActivityEntry,
    });

    /**
     * Sets up hash change listener and periodic refresh on mount.
     * @returns {() => void} Cleanup function to remove interval and event listener.
     */
    onMount(() => {
        /**
         * Updates the hash store with the current window location hash.
         * @returns Current browser location.
         */
        const updateHash = () => hashStore.set(window.location.hash);

        on(window, "hashchange", updateHash);

        updateHash();

        const interval = setInterval(() => {
            void handleRefresh();
        }, 300000);

        return () => {
            clearInterval(interval);
            window.removeEventListener("hashchange", updateHash);
        };
    });
</script>

<AppCompose {dataPromise} {isSpinning} />
