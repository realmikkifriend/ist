<script lang="ts">
    import {
        Icon,
        CalendarDateRange,
        Check,
        Calendar as CalendarIcon,
        Clock,
    } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import { success, error } from "../../services/toastService";
    import { handleTaskDefer, handleTaskDone } from "../../services/taskHandlerService";
    import { previousFirstDueTask } from "../../stores/stores";
    import type { Task } from "../../types/todoist";
    import type { DateTime } from "luxon";

    let {
        task,
        openModal,
    }: {
        task: Task;
        openModal: (modalId: string, props?: Record<string, unknown>) => void;
    } = $props();

    /**
     * Handles marking a task as done, calling the service and showing a toast.
     * @param task - The task to mark as done.
     */
    const onDone = async (task: Task): Promise<void> => {
        previousFirstDueTask.set(null);
        const doneSuccessful = await handleTaskDone(task);
        if (doneSuccessful) {
            success("Task marked done!");
        } else {
            error("Failed to mark task done.");
        }
    };

    /**
     * Handles the final defer action, calling the service and showing a toast.
     * @param detail - The defer event detail containing the task and new time.
     * @param detail.task - The task being deferred.
     * @param detail.time - The new due time for the task.
     */
    const onDeferFinal = async (detail: { task: Task; time: DateTime }): Promise<void> => {
        const { task: deferredTask, time } = detail;
        previousFirstDueTask.set(null);
        const deferSuccessful = await handleTaskDefer([[deferredTask, time]]);

        if (deferSuccessful) {
            success("Task deferred successfully!");
        } else {
            error("Failed to defer task.");
        }
    };
</script>

<div class="card-actions relative -right-5 justify-center">
    <button
        class="text-md btn btn-primary focus:btn-soft relative h-8 min-h-8 content-center p-4 focus:cursor-progress"
        onclick={() => onDone(task)}
        title={task.due?.string ? `repeats ${task.due.string}` : "one-time task"}
        type="button"
    >
        <Icon class="h-5 w-5 [&>path]:stroke-3" src={Check} />
        <kbd>CTRL+Enter</kbd>
    </button>
    <button
        class="text-md btn btn-secondary relative h-8 min-h-8 content-center p-4"
        onclick={() => openModal("defer_modal", { onDeferFinal })}
        type="button"
    >
        {#if task.due?.allDay === 1}
            <Icon class="h-5 w-5 [&>path]:stroke-3" src={CalendarIcon} />
        {:else}
            <Icon class="h-5 w-5 [&>path]:stroke-3" src={Clock} />
        {/if}
        <kbd>d</kbd>
    </button>
    <button
        class="text-md hover:bg-accent btn btn-ghost btn-sm relative -left-1 min-h-8 w-8 content-center border-0 p-0"
        onclick={() => openModal(`calendar_modal_${task.id}`)}
        title="view task completion history"
        type="button"
    >
        <Icon class="stroke-secondary h-5 w-5 [&>path]:stroke-2" src={CalendarDateRange} />
        <kbd>h</kbd>
    </button>
</div>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "d",
                callback: () => openModal("defer_modal"),
                modifier: false,
            },
            {
                key: "Enter",
                callback: () => {
                    void onDone(task);
                },
                modifier: "ctrl",
            },
            {
                key: "h",
                callback: () => openModal(`calendar_modal_${task.id}`),
                modifier: false,
            },
        ],
    }}
/>
