<script lang="ts">
    import { getContext } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown, Inbox, Check, NoSymbol, ChevronUpDown } from "svelte-hero-icons";
    import { getPriorityClasses, colorClasses, borderClasses } from "../../styles/styleUtils";
    import type { Priority } from "../../types/todoist";
    import type { AgendaTaskProps } from "../../types/agenda";
    import type { HandlerMethodsContext, AppStateMutatorsContext } from "../../types/methods";
    import ScheduleModal from "../defer/ScheduleModal.svelte";
    import { handleTaskDefer } from "../../services/taskHandlerService";
    import { success, error } from "../../services/toastService";

    let { task, color }: AgendaTaskProps = $props();

    const modalId = `schedule_modal_${task.id}`;

    const { summonTask, handleRefresh } = getContext<HandlerMethodsContext>("handlerMethods");
    const { clearPreviousDisplayTask, updateTodoistDataResources } =
        getContext<AppStateMutatorsContext>("appStateMutators");

    const displayTaskClasses = "shadow-sm shadow-red-400";
    const taskPriority = task.priority as Priority;

    /**
     * Displays schedule modal.
     */
    const openScheduleModal = (): void => {
        (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal();
    };

    /**
     * Exits the schedule modal.
     */
    const closeScheduleModal = (): void => {
        (document.getElementById(modalId) as HTMLDialogElement | null)?.close();
    };

    /**
     * Schedules a task to a specific time.
     * @param time - The selected DateTime to schedule the task for
     */
    async function handleSchedule(time: DateTime): Promise<void> {
        closeScheduleModal();

        clearPreviousDisplayTask();
        const { success: deferSuccessful, taskUpdates: deferredTaskUpdates } =
            await handleTaskDefer([[task, time]]);

        if (deferSuccessful) {
            updateTodoistDataResources(deferredTaskUpdates);
            success("Task scheduled successfully.");
            await handleRefresh();
        } else {
            error("Failed to schedule task.");
        }
    }
</script>

<div
    class={[
        "agenda-task mx-1 flex  w-full flex-row items-center overflow-hidden rounded-md px-1 text-xs whitespace-nowrap brightness-90",
        task.priority < 3
            ? colorClasses[color].faded || "bg-gray-600"
            : colorClasses[color].default || "bg-gray-600",
        task.priority < 3 ? `border  ${borderClasses[color] || "border-gray-600"}` : "",
        task.displayed ? displayTaskClasses : "",
    ].join(" ")}
>
    <button
        class={`priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 shrink-0 flex-row items-center justify-center rounded-md pr-1 pl-2 text-xs font-bold ${getPriorityClasses(taskPriority)}`}
        onclick={async () => {
            await summonTask(task);
            window.location.hash = "";
        }}
        type="button"
    >
        {#if task.due && task.due.date && task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}

        {#if task.displayed}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={Inbox} />
        {:else}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={InboxArrowDown} />
        {/if}
    </button>

    <button
        class="relative -left-1.5 ml-0 flex h-4 w-4 shrink-0 items-center justify-center rounded-md hover:bg-gray-700"
        onclick={openScheduleModal}
        title="Schedule task"
        type="button"
    >
        <Icon class="h-3 w-3" src={ChevronUpDown} />
    </button>

    {#if task.neverDone}
        <div
            class="relative -left-1 mr-2 rounded-full bg-green-200 outline-3 outline-green-200"
            title="task is never marked done"
        >
            <Icon class="relative top-[0.02em] h-2 w-2 stroke-5 text-green-700" src={Check} />
            <Icon
                class="absolute -top-[0.27em] -left-[0.24em] h-[1.2em] w-[1.15em] stroke-3 text-red-500"
                src={NoSymbol}
            />
        </div>
    {/if}

    <div class="relative -left-1.5 min-w-0 flex-1 truncate">
        {task.content}
    </div>
</div>

<dialog id={modalId} class="modal">
    <ScheduleModal onClose={closeScheduleModal} onSchedule={handleSchedule} {task} />
</dialog>
