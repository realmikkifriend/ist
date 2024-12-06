<script>
    import { DateTime } from "luxon";
    import { InboxArrowDownIcon } from "@krowten/svelte-heroicons";
    import { getPriorityClasses, colorClasses } from "../../js/classes";

    export let task, color;

    function closeAgenda() {
        window.location.hash = "";
    }
</script>

<div
    class={`agenda-task mx-1 flex w-full flex-row items-center overflow-hidden whitespace-nowrap rounded-md px-1 text-xs brightness-90 ${colorClasses[color] || "bg-gray-600"}`}
>
    <button
        on:click={closeAgenda}
        class="priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 flex-shrink-0 flex-row items-center justify-center rounded-md pl-2 pr-1 text-xs font-bold {getPriorityClasses(
            task.priority,
        )}"
    >
        {#if task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}
        <InboxArrowDownIcon class="h-3 min-h-3 w-4 min-w-4" />
    </button>{task.content}
</div>
