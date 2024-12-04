<script>
    import { DateTime } from "luxon";
    import { getPriorityClasses, colorClasses } from "../../js/classes";

    export let task, color;
</script>

<div
    class={`agenda-task mx-1 my-0.5 w-full items-center overflow-hidden whitespace-nowrap rounded-md px-1 text-xs brightness-90 ${colorClasses[color] || "bg-gray-600"}`}
>
    <span
        class="priority-element relative -left-1.5 mt-0 inline-block h-fit min-h-2.5 min-w-4 rounded-md px-1.5 text-xs font-bold {getPriorityClasses(
            task.priority,
        )}"
    >
        {#if task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}
    </span>{task.content}
</div>
