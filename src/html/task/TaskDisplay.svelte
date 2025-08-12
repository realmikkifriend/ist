<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, Forward } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import { firstDueTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { skipTask } from "../../services/firstTaskService";
    import { getPriorityBorder } from "../../utils/styleUtils";
    import Comments from "./Comments.svelte";
    import DeferModal from "../defer/DeferModal.svelte";
    import History from "../interface/History.svelte";
    import TaskActions from "./TaskActions.svelte";
    import type { Task, Priority } from "../../types/todoist";
    import type { DynamicModalProps, TaskDisplayProps } from "../../types/interface";

    let { task, onDefer }: TaskDisplayProps = $props();

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
     * Handles skipping the current task.
     */
    const handleSkipTask = (): void => {
        if ($firstDueTask) {
            void skipTask($firstDueTask).then(({ task, contextCleared }) => {
                firstDueTask.set(task);
                if (contextCleared) {
                    userSettings.update((settings) => ({
                        ...settings,
                        selectedContext: null,
                    }));
                }
            });
        }
    };

    let modalProps = $state<DynamicModalProps>({});
    /**
     * Opens a modal dialog by its ID and passes props to it.
     * @param modalId - The ID of the modal to open.
     * @param props - Optional props to pass to the modal component.
     */
    const openModal = (modalId: string, props: DynamicModalProps = {}): void => {
        modalProps = props;
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
                    onclick={handleSkipTask}
                    title="skip task"
                    type="button"
                >
                    <Icon class="h-5 w-5 stroke-yellow-500 [&>path]:stroke-3" src={Forward} />
                    <kbd>s</kbd>
                </button>
            {/if}
            <h2 class="card-title text-center text-3xl">{task.content}</h2>
            <TaskActions {openModal} {task} />
        </div>
    </div>
    {#if task.comments}
        <Comments commentsPromise={Promise.resolve(task.comments)} />
    {/if}
</div>

<dialog id="defer_modal" class="modal">
    <DeferModal onDeferFinal={handleDefer} {task} {...modalProps} />
</dialog>

<History activity={task.activity} content={task.content} entityId={task.id} />

<svelte:window
    use:shortcut={{
        trigger: {
            key: "s",
            callback: handleSkipTask,
            modifier: false,
        },
    }}
/>
