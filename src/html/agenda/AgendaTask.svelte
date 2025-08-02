<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown, Inbox } from "svelte-hero-icons";
    import {
        getPriorityClasses,
        colorClasses,
        colorClassesFaded,
        borderClasses,
    } from "../../utils/styleUtils";
    import { summonTask } from "./agenda";
    import type { Task, ColorName, Priority } from "../../../types/todoist";

    export let task: Task;
    export let color: ColorName;

    const firstDueClasses = "shadow-sm shadow-red-400";
    const taskPriority = task.priority as Priority;
</script>

<div
    class={[
        "agenda-task mx-1 flex  w-full flex-row items-center overflow-hidden rounded-md px-1 text-xs whitespace-nowrap brightness-90",
        task.priority < 3
            ? colorClassesFaded[color] || "bg-gray-600"
            : colorClasses[color] || "bg-gray-600",
        task.priority < 3 ? `border  ${borderClasses[color] || "border-gray-600"}` : "",
        task.firstDue ? firstDueClasses : "",
    ].join(" ")}
>
    <button
        on:click={() => summonTask(task)}
        class={`priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 shrink-0 flex-row items-center justify-center rounded-md pr-1 pl-2 text-xs font-bold ${getPriorityClasses(taskPriority)}`}
    >
        {#if task.due && task.due.date && task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}

        {#if task.firstDue}
            <Icon src={Inbox} class="h-3 min-h-3 w-4 min-w-4" />
        {:else}
            <Icon src={InboxArrowDown} class="h-3 min-h-3 w-4 min-w-4" />
        {/if}
    </button>

    {task.content}
</div>
