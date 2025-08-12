<script lang="ts">
    import { onMount } from "svelte";
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
    import { updateFirstDueTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import { toggleAgendaHash } from "../services/agendaService";
    import { newFirstTask, clearToasts, success } from "../services/toastService";
    import AppView from "./AppView.svelte";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import Toasts from "./interface/Toasts.svelte";

    let isSpinning = $state(false);
    let hash = $state(window.location.hash);
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

    $effect(() => {
        if ($userSettings.selectedContext || $todoistData.dueTasks) {
            void (async () => {
                const { task, contextCleared, showNewTaskToast } = await updateFirstDueTask();
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
                }
                if (contextCleared) {
                    success("No more tasks in context! Showing all due tasks...");
                    userSettings.update((settings) => ({ ...settings, selectedContext: null }));
                }
                window.location.hash = "";
            })();
        }
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
