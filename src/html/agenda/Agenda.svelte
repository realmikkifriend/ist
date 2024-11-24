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

    let currentHourSlot = currentHour;
    let currentMinute = DateTime.now().minute;

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
            if (title === "Today") {
                currentHourSlot = currentHour;
                currentMinute = DateTime.now().minute;
            }
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

    const isTaskIndented = (currentTaskDue, previousTaskDue, isPreviousIndented) => {
        if (!previousTaskDue) return false;
        const timeDifference = DateTime.fromISO(currentTaskDue).diff(
            DateTime.fromISO(previousTaskDue),
            "minutes",
        ).minutes;

        return timeDifference <= 10 && !isPreviousIndented;
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

<div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
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
                <div class="hour group relative flex w-full items-start overflow-x-hidden">
                    <strong class="mr-2 w-14 text-right text-sm opacity-50">
                        {hour % 12 === 0 ? 12 : hour % 12}
                        {hour < 12 ? "AM" : "PM"}
                    </strong>
                    <div
                        class="hour-container h-24 flex-grow border-2 border-b-0 border-gray-700 pb-1 pr-2 group-last:border-b-2"
                    >
                        {#if title === "Today" && hour === currentHourSlot}
                            <div
                                class="absolute left-16 h-0.5 w-[83.5%] rounded-badge bg-red-600"
                                style="top: {(currentMinute / 60) * 100}%;"
                                id="today-marker"
                            >
                                <div
                                    class="absolute right-0 h-2 w-2 translate-x-[30%] translate-y-[-40%] rounded-full bg-red-600"
                                ></div>
                            </div>
                        {/if}
                        {#each tasks as task, index}
                            {#if DateTime.fromISO(task.due.date).hour === hour}
                                <div
                                    class="task-container absolute z-10 w-[80%]"
                                    style="
                                        top: {calculateTaskPosition(task)}%; 
                                        opacity: {DateTime.fromISO(task.due.date) > DateTime.now()
                                        ? 0.75
                                        : 1};
                                        margin-left: {isTaskIndented(
                                        task.due.date,
                                        tasks[index - 1]?.due.date,
                                        index > 0
                                            ? isTaskIndented(
                                                  tasks[index - 1]?.due.date,
                                                  tasks[index - 2]?.due.date,
                                                  false,
                                              )
                                            : false,
                                    )
                                        ? '10rem'
                                        : '0'};
                                    "
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
