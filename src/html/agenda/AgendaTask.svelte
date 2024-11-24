<script>
    import { DateTime } from "luxon";
    import { getPriorityClasses } from "../../js/priority"; // Import the function

    export let task;

    function formatTime(dateString) {
        return DateTime.fromISO(dateString).toFormat("hh:mm a");
    }
</script>

<div class="m-1 w-full rounded-md px-1 text-xs {getPriorityClasses(task.priority)}">
    {#if task.due.date.includes("T")}
        <strong>{formatTime(task.due.date)}</strong> {task.content}
    {:else}
        {task.content}
    {/if}
</div>
