<script>
    import AgendaHeader from "./AgendaHeader.svelte";

    import AgendaHour from "./AgendaHour.svelte";
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
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
    let headerGradientColor;
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

        headerGradientColor = getGradientColor();
    };

    function getTaskColor(id) {
        const context = $todoistResources.contexts.find((context) => context.id === id);
        return context?.color || null;
    }

    function getGradientColor() {
        const gradientGreen = "bg-gradient-to-r from-green-900 to-green-700";
        const gradientRed = "bg-gradient-to-r from-red-900 to-red-700";

        if (window.location.hash === "#tomorrow") {
            const totalTasks =
                (tasks?.length || 0) + (tasksWithNoTime?.length || 0) + (todayTasks?.length || 0);

            return totalTasks > 18 ? gradientRed : totalTasks < 15 ? gradientGreen : "";
        } else if (window.location.hash === "#today") {
            const totalTasks = (tasks?.length || 0) + (tasksWithNoTime?.length || 0);
            const currentHour = new Date().getHours();
            const hourAdjustment = currentHour > 8 ? currentHour - 8 : 0;
            const todayThreshold = 14 - hourAdjustment;

            if (totalTasks <= todayThreshold - 2) {
                return gradientGreen;
            } else if (totalTasks > todayThreshold) {
                return gradientRed;
            } else {
                return "";
            }
        } else {
            return "";
        }
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
    <AgendaHeader {title} {tasks} {tasksWithNoTime} {todayTasks} {headerGradientColor} />

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
