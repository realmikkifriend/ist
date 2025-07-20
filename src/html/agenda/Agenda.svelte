<script>
    import AgendaHeader from "./AgendaHeader.svelte";
    import AgendaHour from "./AgendaHour.svelte";
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { todoistData } from "../../js/stores";
    import { filterAndSortTasks } from "../../js/filter";
    import { getTasksForDate, sortAgendaTasks } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";
    import { getGradientColor } from "../../js/classes.js";

    let tasks,
        tasksForDate,
        tasksWithNoTime,
        todayTasks = [];
    const hourSlots = Array.from({ length: 18 }, (_, i) => i + 6);
    let displayHours = {};
    let headerGradientColor;
    let now;

    $: $todoistData, updatePage();

    const getTitle = () => {
        return window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
    };

    const updatePage = () => {
        now = DateTime.now();

        const currentTitle = getTitle();

        const targetDate =
            window.location.hash === "#today"
                ? now
                : window.location.hash === "#tomorrow"
                  ? now.plus({ days: 1 })
                  : null;

        if (window.location.hash === "#tomorrow") {
            tasksForDate = getTasksForDate(now, $todoistData);
            const tasksForTomorrow = sortAgendaTasks(tasksForDate);

            todayTasks = [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks];
        }

        if (targetDate) {
            tasksForDate = getTasksForDate(targetDate, $todoistData);
            ({ tasksWithNoTime, tasks } = sortAgendaTasks(tasksForDate));
        } else {
            tasksForDate = tasksWithNoTime = tasks = [];
        }

        if (tasksWithNoTime.length > 2) {
            tasksWithNoTime = filterAndSortTasks(tasksWithNoTime, $todoistData.contexts);
        }

        if (currentTitle === "Today") {
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

        const totalTasks =
            (tasks?.length || 0) +
            (tasksWithNoTime?.length || 0) +
            (window.location.hash === "#tomorrow" ? todayTasks?.length || 0 : 0);

        headerGradientColor = getGradientColor(totalTasks);
    };

    function getTaskColor(id) {
        const context = $todoistData.contexts.find((context) => context.id === id);
        return context?.color || null;
    }

    onMount(() => {
        if ($todoistData.tasks) {
            $todoistData.tasks.forEach((task) => {
                delete task.summoned;
                delete task.firstDue;
            });
        }

        updatePage();
        window.addEventListener("hashchange", updatePage);
    });

    onDestroy(() => {
        window.removeEventListener("hashchange", updatePage);
    });
</script>

{#key tasks}
    <div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
        <AgendaHeader
            title={getTitle()}
            {tasks}
            {tasksWithNoTime}
            {todayTasks}
            {tasksForDate}
            {headerGradientColor}
        />

        {#if tasksWithNoTime.length > 0}
            <div class="mb-4 flex w-full flex-col items-center pl-[4.5rem] pr-2">
                {#each tasksWithNoTime as task (task.id)}
                    <AgendaTask {task} color={getTaskColor(task.contextId)} />
                {/each}
            </div>
        {/if}

        <div class="w-[99%] overflow-hidden pr-1">
            {#key (now.hour, tasks)}
                {#each hourSlots as hour (hour)}
                    {#if displayHours[hour]}
                        <AgendaHour
                            title={getTitle()}
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
{/key}
