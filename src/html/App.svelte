<script lang="ts">
    import { onMount, setContext } from "svelte";
    import { get } from "svelte/store";
    import { on } from "svelte/events";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import {
        todoistData,
        firstDueTask,
        todoistError,
        previousFirstDueTask,
    } from "../stores/stores";
    import { userSettings } from "../stores/interface";
    import { debounceState } from "../services/firstTaskService";
    import { updateFirstDueTask, skipTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import { toggleAgendaHash } from "../services/agendaService";
    import { newFirstTask, clearToasts, success } from "../services/toastService";
    import AppView from "./AppView.svelte";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import Toasts from "./interface/Toasts.svelte";
    import type { Task, UpdateFirstDueTaskResult } from "../types/todoist";

    let isSpinning = $state(false);
    let hash = $state(window.location.hash);

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
        const selectedContext = get(userSettings).selectedContext;

        if ($firstDueTask?.summoned) {
            window.location.hash = $firstDueTask.summoned as string;
        }

        if ($firstDueTask?.summoned || selectedContext) {
            if (selectedContext) {
                clearSelectedContext();
                success("No more tasks in context! Showing all due tasks...");
            }
            await updateDisplayedTask();
        }
    };

    /**
     * Clears the selected context in user settings.
     */
    const clearSelectedContext = (): void => {
        userSettings.update((settings) => ({ ...settings, selectedContext: null }));
    };

    /**
     * Updates the displayed task.
     * @returns Promise that resolves when the task is updated.
     */
    const updateDisplayedTask = async (): Promise<void> => {
        const { task, showNewTaskToast, contextCleared, updatedTodoistData } =
            await updateFirstDueTask();

        if (updatedTodoistData) {
            todoistData.set(updatedTodoistData);
        }

        if (task) {
            if (showNewTaskToast && task?.id !== $firstDueTask?.id) {
                newFirstTask((t) => {
                    firstDueTask.set(t);
                    previousFirstDueTask.set(t);
                }, task);
            } else {
                firstDueTask.set(task);
                previousFirstDueTask.set(task);

                clearToasts(undefined, "info");
            }
        } else {
            firstDueTask.set(null);
            previousFirstDueTask.set(null);
        }

        if (contextCleared) {
            userSettings.update((settings) => ({ ...settings, selectedContext: null }));
        }
    };

    /**
     * Handles clicking on a context button.
     * Updates the selected context in user settings.
     * @param contextId - The ID of the context that was clicked.
     */
    function handleContextChange(contextId: string | null): void {
        previousFirstDueTask.set(null);
        const isCurrentlySelected = $userSettings.selectedContext?.id === contextId;
        let newSelectedContext = isCurrentlySelected
            ? null
            : contextId
              ? {
                    id: contextId,
                    name: $todoistData.contexts.find((c) => c.id === contextId)?.name || "",
                }
              : null;

        userSettings.update((settings) => ({
            ...settings,
            selectedContext: newSelectedContext,
        }));
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
            debounceState.clearDebounceTimeout();
            if (enableSkip) {
                task.skip = true;
            }
            const currentFirstDueSummoned = get(firstDueTask)?.summoned;

            task.summoned = currentFirstDueSummoned || window.location.hash;

            const result = await updateFirstDueTask(task);
            firstDueTask.set(result.task);
            previousFirstDueTask.set(result.task);
            return result;
        }
        return {
            task: get(firstDueTask),
            showNewTaskToast: false,
            contextCleared: false,
            dueTasks: get(todoistData).dueTasks,
        };
    }

    setContext("methods", {
        handleRefresh,
        handleClearSelectedTask,
        handleContextChange,
        updateDisplayedTask,
        handleSkipTask,
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
        const updateHash = () => (hash = window.location.hash);

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

<div class="flex w-fit items-center">
    <Sidebar {hash} />

    {#if $firstDueTask && hash !== "#today" && hash !== "#tomorrow"}
        {#key $firstDueTask.id}
            <ContextBadge />
        {/key}
    {/if}
</div>

{#if hash === "#today" || hash === "#tomorrow"}
    <Agenda />
{:else}
    <AppView {dataPromise} />
{/if}

<div class="fixed right-2 bottom-2 z-10">
    <button class="bg-base-100 rounded-md p-1" onclick={handleRefresh} type="button">
        <Icon class="h-6 w-6 {isSpinning ? 'animate-spin cursor-wait' : ''}" src={ArrowPath} />
    </button>
</div>

<Toasts />

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "a",
                callback: () => {
                    toggleAgendaHash();
                    window.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: "c",
                            bubbles: true,
                            ctrlKey: true,
                            shiftKey: true,
                        }),
                    );
                },
                modifier: false,
            },
        ],
    }}
/>
