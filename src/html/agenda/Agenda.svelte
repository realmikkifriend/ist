<script>
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { todoistData } from "../../js/stores";
    import { getGradientColor } from "../../js/classes";
    import { filterAndSortTasks } from "../../js/filter";
    import { getTasksForDate, sortAgendaTasks } from "./agenda";
    import AgendaHeader from "./AgendaHeader.svelte";
    import AgendaHour from "./AgendaHour.svelte";
    import AgendaTask from "./AgendaTask.svelte";

    const agendaStore = writable({
        tasks: [],
        tasksForDate: [],
        tasksWithNoTime: [],
        todayTasks: [],
    });
    const hourSlots = Array.from({ length: 18 }, (_, i) => i + 6);
    let now;

    $: $todoistData, updatePage();

    const getTitle = () => {
        return window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
    };

    function computeHeaderGradientColor(agendaData) {
        const totalTasks =
            (agendaData.tasks?.length || 0) +
            (agendaData.tasksWithNoTime?.length || 0) +
            (window.location.hash === "#tomorrow" ? agendaData.todayTasks?.length || 0 : 0);

        return getGradientColor(totalTasks);
    }

    function getDisplayHours(agendaData, now, hourSlots) {
        if (getTitle() === "Today") {
            const result = {};
            hourSlots.forEach((hour) => {
                const hourTasks = agendaData.tasks.filter(
                    (task) => DateTime.fromISO(task.due.date).hour === hour,
                );
                result[hour] = hour >= now.hour || hourTasks.length > 0;
            });
            return result;
        } else {
            const result = {};
            hourSlots.forEach((hour) => (result[hour] = true));
            return result;
        }
    }

    const updatePage = () => {
        now = DateTime.now();

        const currentTitle = getTitle();

        const targetDate =
            window.location.hash === "#today"
                ? now
                : window.location.hash === "#tomorrow"
                  ? now.plus({ days: 1 })
                  : null;

        const tasksForDate = targetDate ? getTasksForDate(targetDate, $todoistData) : [];
        const sortedTasks = targetDate
            ? sortAgendaTasks(tasksForDate)
            : { tasksWithNoTime: [], tasks: [] };

        const tasksForTomorrow =
            window.location.hash === "#tomorrow"
                ? sortAgendaTasks(getTasksForDate(now, $todoistData))
                : { tasksWithNoTime: [], tasks: [] };

        const tasksWithNoTime =
            sortedTasks.tasksWithNoTime.length > 2
                ? filterAndSortTasks(sortedTasks.tasksWithNoTime, $todoistData.contexts)
                : sortedTasks.tasksWithNoTime;

        const tasks = sortedTasks.tasks;
        const todayTasks =
            window.location.hash === "#tomorrow"
                ? [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks]
                : [];

        const newAgendaData = {
            tasks,
            tasksForDate: tasksForDate,
            tasksWithNoTime,
            todayTasks,
        };

        agendaStore.set(newAgendaData);
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

{#key $agendaStore.tasks}
    <div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
        <AgendaHeader
            agendaData={$agendaStore}
            displayData={{
                title: getTitle(),
                headerGradientColor: computeHeaderGradientColor($agendaStore),
            }}
        />

        {#if $agendaStore.tasksWithNoTime.length > 0}
            <div class="mb-4 flex w-full flex-col items-center pl-[4.5rem] pr-2">
                {#each $agendaStore.tasksWithNoTime as task (task.id)}
                    <AgendaTask {task} color={getTaskColor(task.contextId)} />
                {/each}
            </div>
        {/if}

        <div class="w-[99%] overflow-hidden pr-1">
            {#key (now.hour, $agendaStore.tasks)}
                {#each hourSlots as hour (hour)}
                    {#if getDisplayHours($agendaStore, now, hourSlots)[hour]}
                        <AgendaHour
                            title={getTitle()}
                            {hour}
                            {now}
                            tasks={$agendaStore.tasks.filter(
                                (task) => DateTime.fromISO(task.due.date).hour === hour,
                            )}
                        />
                    {/if}
                {/each}
            {/key}
        </div>
    </div>
{/key}
