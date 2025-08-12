<script lang="ts">
    import { DateTime } from "luxon";
    import { shortcut } from "@svelte-put/shortcut";
    import {
        todoistData,
        todoistError,
        firstDueTask,
        previousFirstDueTask,
    } from "../stores/stores";
    import { skipTask } from "../services/firstTaskService";
    import { error as showError, success } from "../services/toastService";
    import { handleTaskDone, handleTaskDefer } from "../services/taskHandlerService";
    import NoTasks from "./NoTasks.svelte";
    import TaskDisplay from "./task/TaskDisplay.svelte";
    import type { PromiseProp } from "../types/interface";
    import type { Task } from "../types/todoist";

    let { dataPromise }: PromiseProp = $props();

    /**
     * Handles the "done" event from TaskDisplay.
     * @param task - The task to mark done.
     */
    const handleDone = async (task: Task): Promise<void> => {
        if (task.summoned) window.location.hash = String(task.summoned);
        previousFirstDueTask.set(null);
        const doneSuccessful = await handleTaskDone(task);
        if (doneSuccessful) {
            success("Task marked done!");
        } else {
            showError("Failed to mark task done.");
        }
    };

    /**
     * Handles the "defer" event from TaskDisplay.
     * @param detail - Contains the event information.
     * @param detail.task - The task being affected.
     * @param detail.time - The time the task will be deferred to.
     */
    const handleDefer = async (detail: { task: Task; time: string }): Promise<void> => {
        if (detail.task.summoned && !detail.task.skip) {
            window.location.hash = String(detail.task.summoned);
        }

        previousFirstDueTask.set(null);
        const { task, time } = detail;
        const dateTime = DateTime.fromISO(time);
        if (dateTime.isValid) {
            const deferSuccessful = await handleTaskDefer([[task, dateTime]]);
            if (deferSuccessful) {
                success("Task deferred successfully!");
            } else {
                showError("Failed to defer task.");
            }
        } else {
            showError("Received unexpected type of date...");
        }

        if (task.skip) {
            void skipTask(task);
        }
    };
</script>

{#await dataPromise}
    <div class="hero">Loading...</div>
{:then}
    {#if $todoistData.tasks}
        {#if $firstDueTask}
            {#key $firstDueTask.id}
                <TaskDisplay onDefer={handleDefer} onDone={handleDone} task={$firstDueTask} />
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

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "?",
                callback: () => {
                    document.body.classList.toggle("show-kbd");
                },
                modifier: "shift",
            },
        ],
    }}
/>
