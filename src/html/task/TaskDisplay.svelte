<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, Forward } from "svelte-hero-icons";
    import { skipTask } from "../../services/firstTaskService";
    import { getPriorityBorder } from "../../utils/styleUtils";
    import Comments from "./Comments.svelte";
    import DeferModal from "../defer/DeferModal.svelte";
    import History from "../interface/History.svelte";
    import TaskActions from "./TaskActions.svelte";
    import type { Task, Priority } from "../../types/todoist";
    import type { TaskDisplayProps } from "../../types/defer";

    let { task, onDone, onDefer }: TaskDisplayProps = $props();

    const priorityBorderClass = getPriorityBorder(task.priority as Priority);

    /**
     * Handles deferring the task, closes the modal, and calls the onDefer prop.
     * @param detail - The deferred task and time (as DateTime).
     * @param detail.task - The deferred task.
     * @param detail.time - The time (as DateTime).
     */
    const handleDefer = (detail: { task: Task; time: DateTime }): void => {
        (document.getElementById("defer_modal") as HTMLDialogElement | null)?.close();
        onDefer({ task: detail.task, time: detail.time.toISO() ?? "" });
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
            {#if task.skip}
                <button
                    class="text-md hover:bg-accent btn btn-ghost btn-sm absolute top-0 right-0 h-8 min-h-8 content-center border-0 p-4"
                    onclick={() => skipTask(task)}
                    title="skip task"
                    type="button"
                >
                    <Icon class="h-5 w-5 stroke-yellow-500 [&>path]:stroke-3" src={Forward} />
                </button>
            {/if}
            <h2 class="card-title text-center text-3xl">{task.content}</h2>
            <TaskActions {onDone} {openModal} {task} />
        </div>
    </div>
    {#if task.comments}
        <Comments commentsPromise={Promise.resolve(task.comments)} />
    {/if}
</div>

<dialog id="defer_modal" class="modal">
    <DeferModal onDeferFinal={handleDefer} {task} />
</dialog>

<History activity={task.activity} content={task.content} entityId={task.id} />
