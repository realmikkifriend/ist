<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown, Inbox } from "svelte-hero-icons";
    import { getPriorityClasses, colorClasses, borderClasses } from "../../js/classes";
    import { summonTask } from "./agenda";
    import type { Task, ColorName, Priority } from "../../../types/todoist";

    export let task: Task;
    export let color: ColorName;

    const firstDueClasses = "shadow-sm shadow-red-400";
    const taskPriority = task.priority as Priority;
</script>

<div
    class={[
        "agenda-task mx-1 flex w-full flex-row items-center overflow-hidden whitespace-nowrap rounded-md px-1 text-xs brightness-90",
        colorClasses[color] || "bg-gray-600",
        task.priority < 3
            ? `border bg-opacity-50 ${borderClasses[color] || "border-gray-600"}`
            : "",
        task.firstDue ? firstDueClasses : "",
    ].join(" ")}
>
    <button
        on:click={() => summonTask(task)}
        class={`priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 flex-shrink-0 flex-row items-center justify-center rounded-md pl-2 pr-1 text-xs font-bold ${getPriorityClasses(taskPriority)}`}
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
