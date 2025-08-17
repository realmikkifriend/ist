<script lang="ts">
    import { getContext } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown, Inbox } from "svelte-hero-icons";
    import { getPriorityClasses, colorClasses, borderClasses } from "../../styles/styleUtils";
    import type { Priority } from "../../types/todoist";
    import type { AgendaTaskProps } from "../../types/agenda";
    import type { MethodsContext } from "../../types/methods";

    let { task, color }: AgendaTaskProps = $props();

    const { summonTask } = getContext<MethodsContext>("methods");

    const firstDueClasses = "shadow-sm shadow-red-400";
    const taskPriority = task.priority as Priority;
</script>

<div
    class={[
        "agenda-task mx-1 flex  w-full flex-row items-center overflow-hidden rounded-md px-1 text-xs whitespace-nowrap brightness-90",
        task.priority < 3
            ? colorClasses[color].faded || "bg-gray-600"
            : colorClasses[color].default || "bg-gray-600",
        task.priority < 3 ? `border  ${borderClasses[color] || "border-gray-600"}` : "",
        task.firstDue ? firstDueClasses : "",
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

        {#if task.firstDue}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={Inbox} />
        {:else}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={InboxArrowDown} />
        {/if}
    </button>

    {task.content}
</div>
