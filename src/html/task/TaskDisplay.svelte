<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { Icon, Check, Calendar, Clock, Forward } from "svelte-hero-icons";
    import DeferModal from "../defer/DeferModal.svelte";
    import Comments from "./Comments.svelte";
    import { getPriorityBorder } from "../../js/classes";
    import { skipTask } from "../../js/first";
    import { DateTime } from "luxon";
    import type { Task, Priority } from "../../../types/todoist";

    export let task: Task;

    const priorityBorderClass = getPriorityBorder(task.priority as Priority);

    const dispatch = createEventDispatcher<{
        done: { task: Task };
        defer: { task: Task; time: string };
    }>();

    /**
     * Handles marking the task as done and dispatches a "done" event.
     */
    const handleDone = (): void => {
        if (task.summoned) window.location.hash = String(task.summoned);
        dispatch("done", { task });
    };

    /**
     * Handles deferring the task, closes the modal, and dispatches a "defer" event.
     * @param event - The event containing the deferred task and time (as DateTime).
     */
    const handleDefer = (event: CustomEvent<{ task: Task; time: DateTime }>): void => {
        (document.getElementById("defer_modal") as HTMLDialogElement | null)?.close();
        if (event.detail.task.summoned) window.location.hash = String(event.detail.task.summoned);
        // Convert DateTime to ISO string before dispatching
        dispatch("defer", { task: event.detail.task, time: event.detail.time.toISO() ?? "" });
    };

    /**
     * Handles skipping the task.
     */
    const handleSkip = (): void => {
        skipTask(task);
    };

    /**
     * Opens the defer modal dialog.
     */
    const openModal = (): void => {
        (document.getElementById("defer_modal") as HTMLDialogElement | null)?.showModal();
    };
</script>

<div class="mx-auto mt-4 max-w-72 sm:mt-2 sm:max-w-sm">
    <div
        class={`card mt-0 rounded-xl border-b-[0.75rem] border-opacity-50 bg-neutral text-primary-content ${priorityBorderClass}`}
    >
        <div class="card-body pb-7">
            {#if task.skip}
                <button
                    class="text-md btn btn-ghost btn-sm absolute right-0 top-0 h-8 min-h-8 content-center p-4"
                    title="skip task"
                    on:click={handleSkip}
                >
                    <Icon src={Forward} class="h-5 w-5 stroke-yellow-500 [&>path]:stroke-[3]" />
                </button>
            {/if}
            <h2 class="card-title text-center text-3xl">{task.content}</h2>
            <div class="card-actions justify-center">
                <button
                    class="text-md btn btn-primary h-8 min-h-8 content-center p-4"
                    title={task.due?.string ? `repeats ${task.due.string}` : "one-time task"}
                    on:click={handleDone}
                >
                    <Icon src={Check} class="h-5 w-5 [&>path]:stroke-[3]" />
                </button>
                <button
                    class="text-md btn btn-secondary h-8 min-h-8 content-center p-4"
                    on:click={openModal}
                >
                    {#if task.due?.allDay === 1}
                        <Icon src={Calendar} class="h-5 w-5 [&>path]:stroke-[3]" />
                    {:else}
                        <Icon src={Clock} class="h-5 w-5 [&>path]:stroke-[3]" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {#if task.comments}
        <Comments comments={task.comments} />
    {/if}
</div>

<dialog id="defer_modal" class="modal">
    <DeferModal {task} on:defer={handleDefer} />
</dialog>
