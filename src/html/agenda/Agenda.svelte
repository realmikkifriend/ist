<script>
    import AgendaHour from "./AgendaHour.svelte";
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { XCircleIcon, CalendarIcon } from "@krowten/svelte-heroicons";
    import { todoistResources } from "../../js/stores";
    import { filterAndSortDueTasks } from "../../js/filter";
    import { getTasksForDate } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";

    let title = "";
    let tasks,
        tasksWithNoTime,
        todayTasks = [];
    let hourSlots = Array.from({ length: 18 }, (_, i) => i + 6);
    let displayHours = {};
    let now;

    $: $todoistResources, updatePage();

    const updatePage = () => {
        now = DateTime.now();

        title = window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());

        const targetDate =
            window.location.hash === "#today"
                ? now
                : window.location.hash === "#tomorrow"
                  ? now.plus({ days: 1 })
                  : null;

        if (window.location.hash === "#tomorrow") {
            const tasksForTomorrow = getTasksForDate(now, $todoistResources);

            todayTasks = [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks];
        }

        ({ tasksWithNoTime, tasks } = targetDate
            ? getTasksForDate(targetDate, $todoistResources)
            : { tasks: [], tasksWithNoTime: [] });

        if (tasksWithNoTime.length > 2) {
            tasksWithNoTime = filterAndSortDueTasks(
                tasksWithNoTime,
                $todoistResources.contexts,
                false,
            );
        }

        if (title === "Today") {
            displayHours = {};
            hourSlots.forEach((hour) => {
                const hourTasks = tasks.filter(
                    (task) => DateTime.fromISO(task.due.date).hour === hour,
                );
                displayHours[hour] = hour >= now.hour || hourTasks.length > 0;
            });
        } else {
            hourSlots.forEach((hour) => (displayHours[hour] = true));
        }
    };

    function switchView() {
        window.location.hash = window.location.hash === "#today" ? "#tomorrow" : "#today";
    }

    function closeAgenda() {
        window.location.hash = "";
    }

    function getTaskColor(id) {
        const context = $todoistResources.contexts.find((context) => context.id === id);
        return context?.color || null;
    }

    onMount(() => {
        if ($todoistResources.items) {
            $todoistResources.items.forEach((item) => {
                delete item.summoned;
                delete item.firstDue;
            });
        }

        updatePage();
        window.addEventListener("hashchange", updatePage);
    });

    onDestroy(() => {
        window.removeEventListener("hashchange", updatePage);
    });
</script>

<div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
    <div class="flex items-center justify-between pb-2 pl-16">
        <button
            on:click={switchView}
            class="rounded-full p-2 transition-colors duration-200 hover:bg-blue-800"
        >
            <CalendarIcon class="h-5 w-6" />
        </button>
        <div class="flex flex-col items-center">
            <h1 class="flex-1 text-center">{title}</h1>
            <h2
                class="rounded-badge px-3 py-0.5 text-center
                {tasks?.length +
                    tasksWithNoTime?.length +
                    (window.location.hash === '#tomorrow' ? todayTasks?.length : 0) >
                18
                    ? 'bg-gradient-to-r from-red-900 to-red-700'
                    : ''}"
            >
                {#if todayTasks.length > 0 && window.location.hash === "#tomorrow"}
                    <div class="mt-2 text-xs/[.1rem]">
                        {tasks.length + tasksWithNoTime.length}+{todayTasks.length}=
                    </div>
                    {tasks.length + tasksWithNoTime.length + todayTasks.length}
                {:else}
                    {tasks.length + tasksWithNoTime.length}
                {/if}
                tasks
            </h2>
        </div>
        <button
            on:click={closeAgenda}
            class="rounded-full p-2 transition-colors duration-200 hover:bg-red-700"
        >
            <XCircleIcon class="h-5 w-6" />
        </button>
    </div>

    {#if tasksWithNoTime.length > 0}
        <div class="mb-4 flex w-full flex-col items-center pl-[4.5rem] pr-2">
            {#each tasksWithNoTime as task}
                <AgendaTask {task} color={getTaskColor(task.context_id)} />
            {/each}
        </div>
    {/if}

    <div class="w-[99%] overflow-hidden pr-1">
        {#key (now.hour, tasks)}
            {#each hourSlots as hour}
                {#if displayHours[hour]}
                    <AgendaHour
                        {title}
                        {hour}
                        {now}
                        tasks={tasks.filter(
                            (task) => DateTime.fromISO(task.due.date).hour === hour,
                        )}
                    />
                {/if}
            {/each}
        {/key}
    </div>
</div>
