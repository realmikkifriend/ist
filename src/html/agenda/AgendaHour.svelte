<script>
    import { DateTime } from "luxon";
    import { todoistResources } from "../../js/stores";
    import { getQuarterHourPosition } from "../../js/classes";
    import { markCloseTasks, calculateTaskPosition, calculateTaskStyle } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";

    export let tasks, hour, title, now;

    const currentHour = title === "Today" && hour === now.hour;

    function getTaskColor(id) {
        const context = $todoistResources.contexts.find((context) => context.id === id);
        return context?.color || null;
    }

    const processedTasks = markCloseTasks(tasks);
</script>

<div class="hour group relative flex w-full items-start">
    <div
        class="mr-1 flex w-16 min-w-16 flex-row items-center justify-end text-right font-extrabold"
    >
        {#if tasks.length >= 4}
            <span class="mr-0.5 text-xs text-red-500">4+</span>
        {/if}

        <span class="mr-0.5 text-xs brightness-50">
            {hour % 12 === 0 ? 12 : hour % 12}
            {hour < 12 ? "AM" : "PM"}
        </span>
    </div>

    <div
        class="hour-container relative {currentHour
            ? 'z-20'
            : 'z-10'} h-24 w-[70%] flex-grow border-2 border-t-0 border-gray-700 group-first:border-t-2"
    >
        {#each [0.25, 0.5, 0.75] as position}
            <div
                class={`absolute left-0 w-full border-t border-gray-800 ${getQuarterHourPosition(position)}`}
            ></div>
        {/each}
        {#if currentHour}
            <div
                class="absolute left-0 z-40 h-0.5 w-full rounded-badge bg-red-600"
                style="top: {(now.minute / 60) * 100}%;"
                id="today-marker"
            >
                <div
                    class="absolute -right-[0.3rem] -top-[0.2rem] h-2 w-2 rounded-full bg-red-600"
                ></div>
            </div>
        {/if}
        <div class="clipped flex w-full flex-col py-0.5 pr-1">
            {#each processedTasks as task, index}
                <div
                    class="task-container w-[98%] {calculateTaskStyle(index, processedTasks)}"
                    style="
        margin-top: {calculateTaskPosition(task, processedTasks[index - 1])}rem;
        filter: {DateTime.fromISO(task.due.date) > now && title === 'Today'
                        ? 'brightness(0.75)'
                        : 'brightness(1)'};
    "
                >
                    <AgendaTask {task} color={getTaskColor(task.context_id)} />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .clipped {
        clip-path: inset(0 0.01rem -15rem 0);
    }
</style>
