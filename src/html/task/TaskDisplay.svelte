<script lang="ts">
    import { DateTime } from "luxon";
    import { getPriorityBorder } from "../../styles/styleUtils";
    import Comments from "./Comments.svelte";
    import DeferModal from "../defer/DeferModal.svelte";
    import History from "../interface/History.svelte";
    import TaskActions from "./TaskActions.svelte";
    import type { Task, Priority } from "../../types/todoist";
    import type { DynamicModalProps } from "../../types/interface";

    let { task }: { task: Task } = $props();

    const priorityBorderClass = $derived(getPriorityBorder(task.priority as Priority));

    let modalProps = $state<DynamicModalProps>({});
    /**
     * Opens a modal dialog by its ID and passes props to it.
     * @param modalId - The ID of the modal to open.
     * @param props - Optional props to pass to the modal component.
     */
    const openModal = (modalId: string, props: DynamicModalProps = {}): void => {
        modalProps = { ...props };
        if (modalProps.onDeferFinal) {
            const originalOnDeferFinal = modalProps.onDeferFinal;
            modalProps.onDeferFinal = (detail: { task: Task; time: DateTime }) => {
                originalOnDeferFinal(detail);
                closeModal(modalId);
            };
        }
        (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal();
    };

    const closeModal = (modalId: string): void => {
        (document.getElementById(modalId) as HTMLDialogElement | null)?.close();
    };
</script>

<div class="xs:max-w-72 xs:mt-2 mx-auto mt-0 max-w-full sm:max-w-sm">
    <div
        class={`card bg-neutral text-primary-content mt-0 rounded-xl border-b-[0.75rem] ${priorityBorderClass}`}
    >
        <div class="card-body xs:p-5 p-2 pb-0">
            <h2 class="card-title text-md xs:text-3xl text-center">{task.content}</h2>
            <TaskActions {openModal} {task} />
        </div>
    </div>
    {#if task.comments}
        <div class="xs:block hidden">
            <Comments commentsPromise={Promise.resolve(task.comments)} />
        </div>
    {/if}
</div>

<dialog id="defer_modal" class="modal">
    <DeferModal onDeferFinal={() => closeModal("defer_modal")} {task} {...modalProps} />
</dialog>

{#if task.activity}
    {#key task.activity}
        <History activity={task.activity} content={task.content} entityId={task.id} />
    {/key}
{/if}
