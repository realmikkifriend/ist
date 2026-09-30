<script lang="ts">
    import { onMount, setContext, getContext } from "svelte";
    import { on } from "svelte/events";
    import { todoistData, todoistError, displayTask } from "../stores/stores";
    import { userSettings, hashStore } from "../stores/interface";
    import { debounceState } from "../services/firstTaskService";
    import { updateDisplayTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import AppCompose from "./AppCompose.svelte";
    import type { Task, UpdateDisplayTaskResult } from "../types/todoist";
    import type { AppStateMutatorsContext, HandlerMethodsContext } from "../types/methods";

    let isSpinning = $state(false);

    const { changeSelectedContext, setTask, handleDataUpdates, handleTaskDisplay } =
        getContext<AppStateMutatorsContext>("appStateMutators");

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
        $displayTask?.summoned ? Promise.resolve() : handleRefresh(),
    );

    /**
     * Updates the displayed task.
     * @returns Promise that resolves when the task is updated.
     */
    const updateDisplayedTask = async (): Promise<void> => {
        const { task, showNewTaskToast, doClearContext, updatedTodoistData } =
            await updateDisplayTask();

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
     * Performs the summon action for a task.
     * @param task - The task to summon.
     * @returns The result of updating the first due task.
     */
    async function performSummon(task: Task): Promise<UpdateDisplayTaskResult> {
        debounceState.clearDebounceTimeout();
        const currentDisplayTaskWasSummoned = $displayTask?.summoned;

        task.summoned = currentDisplayTaskWasSummoned || window.location.hash || "#";

        const result = await updateDisplayTask(task);
        setTask(result.task);
        return result;
    }

    /**
     * Summon a task as the first due task.
     * @param task - The task to summon.
     * @returns The summoned task.
     */
    export async function summonTask(task: Task): Promise<UpdateDisplayTaskResult> {
        if (!task.displayed) {
            return performSummon(task);
        }
        return {
            task: $displayTask,
            showNewTaskToast: false,
            doClearContext: false,
            dueTasks: $todoistData.dueTasks,
        };
    }

    setContext<HandlerMethodsContext>("handlerMethods", {
        handleRefresh,
        handleContextChange,
        updateDisplayedTask,
        summonTask,
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
