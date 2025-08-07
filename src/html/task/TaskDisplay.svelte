<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, CalendarDateRange } from "svelte-hero-icons";
    import { Check, Calendar as CalendarIcon, Clock, Forward } from "svelte-hero-icons";
    import { skipTask } from "../../services/firstTaskService";
    import { getPriorityBorder } from "../../utils/styleUtils";
    import { processActivityForCalendar } from "../../utils/calendarUtils";
    import Comments from "./Comments.svelte";
    import DeferModal from "../defer/DeferModal.svelte";
    import History from "../interface/History.svelte";
    import type { Task, Priority } from "../../types/todoist";

    export let task: Task;

    const dateInfo = task.activity
        ? Promise.resolve(task.activity).then(processActivityForCalendar)
        : Promise.resolve({});

    const priorityBorderClass = getPriorityBorder(task.priority as Priority);

    const dispatch = createEventDispatcher<{
        done: { task: Task };
        defer: { task: Task; time: string };
    }>();

    /**
     * Handles marking the task as done and dispatches a "done" event.
     */
    const handleDone = (): void => {
        dispatch("done", { task });
    };

    /**
     * Handles deferring the task, closes the modal, and dispatches a "defer" event.
     * @param event - The event containing the deferred task and time (as DateTime).
     */
    const handleDefer = (event: CustomEvent<{ task: Task; time: DateTime }>): void => {
        (document.getElementById("defer_modal") as HTMLDialogElement | null)?.close();
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
     * Opens a modal dialog by its ID.
     * @param modalId - The ID of the modal to open.
     */
    const openModal = (modalId: string): void => {
        (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal();
    };
</script>

<div class="mx-auto mt-4 max-w-72 sm:mt-2 sm:max-w-sm">
    <div
        class={`card bg-neutral text-primary-content mt-0 rounded-xl border-b-[0.75rem] ${priorityBorderClass}`}
    >
        <div class="card-body pb-7">
            <button
                class="text-md hover:bg-accent btn btn-ghost btn-sm absolute top-0 left-0 h-8 min-h-8 content-center border-0 p-4"
                title="view task completion history"
                on:click={() => openModal(`calendar_modal_${task.id}`)}
            >
                <Icon src={CalendarDateRange} class="stroke-secondary h-5 w-5 [&>path]:stroke-2" />
            </button>
            {#if task.skip}
                <button
                    class="text-md hover:bg-accent btn btn-ghost btn-sm absolute top-0 right-0 h-8 min-h-8 content-center border-0 p-4"
                    title="skip task"
                    on:click={handleSkip}
                >
                    <Icon src={Forward} class="h-5 w-5 stroke-yellow-500 [&>path]:stroke-3" />
                </button>
            {/if}
            <h2 class="card-title text-center text-3xl">{task.content}</h2>
            <div class="card-actions justify-center">
                <button
                    class="text-md btn btn-primary focus:btn-soft h-8 min-h-8 content-center p-4 focus:cursor-progress"
                    title={task.due?.string ? `repeats ${task.due.string}` : "one-time task"}
                    on:click={handleDone}
                >
                    <Icon src={Check} class="h-5 w-5 [&>path]:stroke-3" />
                </button>
                <button
                    class="text-md btn btn-secondary h-8 min-h-8 content-center p-4"
                    on:click={() => openModal("defer_modal")}
                >
                    {#if task.due?.allDay === 1}
                        <Icon src={CalendarIcon} class="h-5 w-5 [&>path]:stroke-3" />
                    {:else}
                        <Icon src={Clock} class="h-5 w-5 [&>path]:stroke-3" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {#if task.comments}
        <Comments commentsPromise={Promise.resolve(task.comments)} />
    {/if}
</div>

<dialog id="defer_modal" class="modal">
    <DeferModal {task} on:defer={handleDefer} />
</dialog>

<History entityId={task.id} content={task.content} {dateInfo} />
