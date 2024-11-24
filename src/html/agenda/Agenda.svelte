<script>
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { XCircleIcon, CalendarIcon } from "@krowten/svelte-heroicons";
    import { todoistResources } from "../../js/stores";
    import { getTasksForDate } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";

    let tasks = [];
    let tasksWithNoTime = [];
    let hourSlots = Array.from({ length: 18 }, (_, i) => i + 6);
    let title = "";
    let displayHours = {};
    const currentHour = DateTime.now().hour;

    $: $todoistResources, updatePage();

    const setTasks = ({ tasks: newTasks, tasksWithNoTime: newTasksWithNoTime }) => {
        tasks = newTasks;
        tasksWithNoTime = newTasksWithNoTime;

        if (title === "Today") {
            updateDisplayHours();
        } else {
            displayHours = {};
            hourSlots.forEach((hour) => {
                displayHours[hour] = true;
            });
        }
    };

    const updateDisplayHours = () => {
        displayHours = {};
        hourSlots.forEach((hour) => {
            const hourTasks = tasks.filter((task) => DateTime.fromISO(task.due.date).hour === hour);
            displayHours[hour] = hour >= currentHour || hourTasks.length > 0;
        });
    };

    const updatePage = () => {
        title = window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
        const today = DateTime.now();
        const tomorrow = today.plus({ days: 1 });
        const targetDate =
            window.location.hash === "#today"
                ? today
                : window.location.hash === "#tomorrow"
                  ? tomorrow
                  : null;

        if (targetDate) {
            ({ tasksWithNoTime, tasks } = getTasksForDate(targetDate, $todoistResources));
        } else {
            tasks = [];
            tasksWithNoTime = [];
        }

        setTasks({ tasks, tasksWithNoTime });
    };

    const calculateTaskPosition = (task) => {
        const taskDateTime = DateTime.fromISO(task.due.date);
        const minutes = taskDateTime.minute;
        return Math.round((minutes / 60) * 90);
    };

    function handleCalendarClick() {
        const currentHash = window.location.hash;
        window.location.hash = currentHash === "#today" ? "#tomorrow" : "#today";
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

<div class="mx-auto mt-[-2rem] max-w-72 sm:max-w-md" id="agenda">
    <div class="flex items-center justify-between pb-2 pl-16">
        <button on:click={handleCalendarClick}>
            <CalendarIcon class="h-5 w-6" />
        </button>
        <div class="flex flex-col items-center">
            <h1 class="flex-1 text-center">
                {title}
            </h1>
            <h2 class="text-center">
                {tasks.length} tasks
            </h2>
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
    <div>
        {#each hourSlots as hour}
            {#if displayHours[hour]}
                <div class="hour group relative flex w-full items-start">
                    <strong class="mr-2 w-14 text-right text-sm opacity-50">
                        {hour % 12 === 0 ? 12 : hour % 12}
                        {hour < 12 ? "AM" : "PM"}
                    </strong>
                    <div
                        class="hour-container h-24 flex-grow border-2 border-b-0 border-gray-700 pb-1 pr-2 group-last:border-b-2"
                    >
                        {#each tasks as task}
                            {#if DateTime.fromISO(task.due.date).hour === hour}
                                <div
                                    class="absolute z-10 w-1/2"
                                    style="top: {calculateTaskPosition(task)}%;"
                                >
                                    <AgendaTask {task} />
                                </div>
                            {/if}
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}
    </div>
</div>
