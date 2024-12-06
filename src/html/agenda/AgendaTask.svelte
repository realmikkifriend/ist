<script>
    import { DateTime } from "luxon";
    import { InboxArrowDownIcon, InboxIcon } from "@krowten/svelte-heroicons";
    import { getPriorityClasses, colorClasses } from "../../js/classes";
    import { summonTask } from "./agenda";

    export let task, color;

    const firstDueClasses = "shadow-sm shadow-red-400";
</script>

<div
    class={`agenda-task mx-1 flex w-full flex-row items-center overflow-hidden whitespace-nowrap rounded-md px-1 text-xs brightness-90 ${colorClasses[color] || "bg-gray-600"} ${task.firstDue ? firstDueClasses : ""}`}
>
    <button
        on:click={summonTask(task)}
        class="priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 flex-shrink-0 flex-row items-center justify-center rounded-md pl-2 pr-1 text-xs font-bold {getPriorityClasses(
            task.priority,
        )}"
    >
        {#if task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}
        {#if task.firstDue}
            <InboxIcon class="h-3 min-h-3 w-4 min-w-4" />
        {:else}
            <InboxArrowDownIcon class="h-3 min-h-3 w-4 min-w-4" />
        {/if}
    </button>{task.content}
</div>
