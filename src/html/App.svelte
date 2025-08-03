<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData, todoistError, userSettings, firstDueTask } from "../stores/stores";
    import { updateFirstDueTask } from "../services/firstTaskService";
    import { refreshData } from "../services/apiService";
    import { error as showError } from "../services/toastService";
    import { handleTaskDone, handleTaskDefer } from "../js/taskHandlers";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import NoTasks from "./NoTasks.svelte";
    import TaskDisplay from "./task/TaskDisplay.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import Toasts from "./Toasts.svelte";
    import type { Writable } from "svelte/store";
    import type { Task } from "../types/todoist";

    const isSpinning: Writable<boolean> = writable(false);
    const hash: Writable<string> = writable(window.location.hash);

    $: {
        if ($userSettings.selectedContext || $todoistData.dueTasks) {
            void updateFirstDueTask();
        }
    }

    /**
     * Sets up hash change listener and periodic refresh on mount.
     * @returns {() => void} Cleanup function to remove interval and event listener.
     */
    onMount(() => {
        /**
         * Updates the hash store with the current window location hash.
         * @returns Current browser location.
         */
        const updateHash = (): void => hash.set(window.location.hash);

        window.addEventListener("hashchange", updateHash);

        updateHash();

        void handleRefresh();

        const interval = setInterval(() => {
            void handleRefresh();
        }, 300000);

        return () => {
            clearInterval(interval);
            window.removeEventListener("hashchange", updateHash);
        };
    });

    /**
     * Handles the "done" event from TaskDisplay.
     * @param event - Event containing the task id in detail.
     * @param event.detail - Contains the event information.
     * @param event.detail.task - The task being affected.
     */
    const handleDone = (event: { detail: { task: Task } }): void => {
        const { task } = event.detail;
        void handleTaskDone(task);
    };

    /**
     * Handles the "defer" event from TaskDisplay.
     * @param event - Event containing the task and time in detail.
     * @param event.detail - Contains the event information.
     * @param event.detail.task - The task being affected.
     * @param event.detail.time - The time the task will be deferred to.
     */
    const handleDefer = (event: CustomEvent<{ task: Task; time: string }>): void => {
        const { task, time } = event.detail;
        const dateTime = DateTime.fromISO(time);
        if (dateTime.isValid) {
            void handleTaskDefer([[task, dateTime]]);
        } else {
            showError("Received unexpected type of date...");
        }
    };

    /**
     * Refreshes Todoist data and manages the spinning state.
     * @returns Promise that resolves when data is refreshed and spinning state is updated.
     */
    const handleRefresh = async (): Promise<void> => {
        isSpinning.set(true);

        await refreshData().finally(() => {
            isSpinning.set(false);
        });
    };

    /**
     * Returns a promise for refreshing data, for use in Svelte's {#await}.
     * @returns Promise for refreshing data.
     */
    const dataPromise = (): Promise<void> => handleRefresh();
</script>

<div class="flex w-fit items-center">
    <Sidebar hash={$hash} />

    {#if $firstDueTask && $hash !== "#today" && $hash !== "#tomorrow"}
        {#key $firstDueTask.id}
            <ContextBadge />
        {/key}
    {/if}
</div>

{#if $hash === "#today" || $hash === "#tomorrow"}
    <Agenda />
{:else}
    {#await dataPromise()}
        <div class="hero">Loading...</div>
    {:then}
        {#if $todoistData.tasks}
            {#if $firstDueTask}
                {#key $firstDueTask.id}
                    <TaskDisplay task={$firstDueTask} on:done={handleDone} on:defer={handleDefer} />
                {/key}
            {:else}
                <NoTasks />
            {/if}
        {:else}
            <div class="hero">No tasks, try adding some</div>
        {/if}
    {:catch error}
        <div class="hero">Error loading Todoist data: {error.message}</div>
    {/await}

    {#if $todoistError}
        {showError($todoistError)}
    {/if}
{/if}

<div class="fixed right-2 bottom-2 z-10">
    <button class="bg-base-100 rounded-md p-1" on:click={handleRefresh}>
        <Icon src={ArrowPath} class="h-6 w-6 {$isSpinning ? 'animate-spin cursor-wait' : ''}" />
    </button>
</div>

<Toasts />
