<script>
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { XCircleIcon, CalendarIcon } from "@krowten/svelte-heroicons";
    import { todoistResources } from "../../js/stores";
    import { getTasksForDate, calculateTaskPosition, calculateTaskStyle } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";

    let tasks = [];
    let tasksWithNoTime = [];
    let hourSlots = Array.from({ length: 18 }, (_, i) => i + 6);
    let title = "";
    let displayHours = {};
    let currentHour, currentMinute;

    $: $todoistResources, updatePage();

    const updatePage = () => {
        const now = DateTime.now();
        currentHour = now.hour;
        currentMinute = now.minute;

        title = window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
        const targetDate =
            window.location.hash === "#today"
                ? now
                : window.location.hash === "#tomorrow"
                  ? now.plus({ days: 1 })
                  : null;

        ({ tasksWithNoTime, tasks } = targetDate
            ? getTasksForDate(targetDate, $todoistResources)
            : { tasks: [], tasksWithNoTime: [] });

        if (title === "Today") {
            displayHours = {};
            hourSlots.forEach((hour) => {
                const hourTasks = tasks.filter(
                    (task) => DateTime.fromISO(task.due.date).hour === hour,
                );
                displayHours[hour] = hour >= currentHour || hourTasks.length > 0;
            });
        } else {
            hourSlots.forEach((hour) => (displayHours[hour] = true));
        }
    };

    function handleCalendarClick() {
        window.location.hash = window.location.hash === "#today" ? "#tomorrow" : "#today";
    }

    function handleAgendaClose() {
        window.location.hash = "";
    }

    onMount(() => {
        updatePage();
        window.addEventListener("hashchange", updatePage);
    });

    onDestroy(() => {
        window.removeEventListener("hashchange", updatePage);
    });
</script>

<div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
    <div class="flex items-center justify-between pb-2 pl-16">
        <button on:click={handleCalendarClick}>
            <CalendarIcon class="h-5 w-6" />
        </button>
        <div class="flex flex-col items-center">
            <h1 class="flex-1 text-center">{title}</h1>
            <h2 class="text-center">{tasks.length} tasks</h2>
        </div>
        <button on:click={handleAgendaClose}>
            <XCircleIcon class="h-5 w-6" />
        </button>
    </div>

    {#if tasksWithNoTime.length > 0}
        <ul class="mb-4 flex w-full flex-col items-center pl-[4.5rem] pr-1.5">
            {#each tasksWithNoTime as task}
                <AgendaTask {task} />
            {/each}
        </ul>
    {/if}

    <div class="w-[99%] overflow-hidden pr-1">
        {#key currentHour}
            {#each hourSlots as hour}
                {#if displayHours[hour]}
                    <div class="hour group relative flex w-full items-start">
                        <strong class="mr-2 w-14 text-right text-sm opacity-50">
                            {hour % 12 === 0 ? 12 : hour % 12}
                            {hour < 12 ? "AM" : "PM"}
                        </strong>
                        <div
                            class="hour-container relative z-10 h-24 flex-grow border-2 border-t-0 border-gray-700 group-first:border-t-2"
                        >
                            {#if title === "Today" && hour === currentHour}
                                <div
                                    class="absolute left-0 z-40 h-0.5 w-full rounded-badge bg-red-600"
                                    style="top: {(currentMinute / 60) * 100}%;"
                                    id="today-marker"
                                >
                                    <div
                                        class="absolute -right-[0.3rem] -top-[0.2rem] h-2 w-2 rounded-full bg-red-600"
                                    ></div>
                                </div>
                            {/if}
                            <div class="clipped w-full pb-1 pr-2">
                                {#each tasks as task, index}
                                    {#if DateTime.fromISO(task.due.date).hour === hour}
                                        <div
                                            class="task-container absolute"
                                            style="
                    top: {calculateTaskPosition(task, tasks[index - 1]?.due.date)}%;
                    opacity: {DateTime.fromISO(task.due.date) > DateTime.now() ? 0.75 : 1};
                    margin-left: {calculateTaskStyle(task, index, tasks).marginLeft};
                    z-index: {calculateTaskStyle(task, index, tasks).zIndex};
                                    "
                                        >
                                            <AgendaTask {task} />
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                        </div>
                    </div>
                {/if}
            {/each}
        {/key}
    </div>
</div>

<style>
    .clipped {
        clip-path: inset(0 0.01rem -15rem 0);
    }
</style>
