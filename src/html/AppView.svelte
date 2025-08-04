<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { todoistData, todoistError, firstDueTask } from "../stores/stores";
    import { userSettings } from "../stores/interface";
    import { updateFirstDueTask, skipTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import { error as showError } from "../services/toastService";
    import { handleTaskDone, handleTaskDefer } from "../services/taskHandlerService";
    import NoTasks from "./NoTasks.svelte";
    import TaskDisplay from "./task/TaskDisplay.svelte";
    import type { Writable } from "svelte/store";
    import type { Task } from "../types/todoist";

    export let dataPromise: Promise<void>;

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
    const handleDone = async (event: { detail: { task: Task } }): Promise<void> => {
        const { task } = event.detail;
        if (task.summoned) window.location.hash = String(task.summoned);
        await handleTaskDone(task);
        void refreshData();
    };

    /**
     * Handles the "defer" event from TaskDisplay.
     * @param event - Event containing the task and time in detail.
     * @param event.detail - Contains the event information.
     * @param event.detail.task - The task being affected.
     * @param event.detail.time - The time the task will be deferred to.
     */
    const handleDefer = async (event: CustomEvent<{ task: Task; time: string }>): Promise<void> => {
        if (event.detail.task.summoned && !event.detail.task.skip) {
            window.location.hash = String(event.detail.task.summoned);
        }

        const { task, time } = event.detail;
        const dateTime = DateTime.fromISO(time);
        if (dateTime.isValid) {
            await handleTaskDefer([[task, dateTime]]);
        } else {
            showError("Received unexpected type of date...");
        }

        if (task.skip) {
            void skipTask(task);
        } else {
            void refreshData();
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
</script>

{#await dataPromise}
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
