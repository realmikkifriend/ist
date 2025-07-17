<script>
    import AgendaHeader from "./AgendaHeader.svelte";

    import AgendaHour from "./AgendaHour.svelte";
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { todoistData } from "../../js/stores";
    import { filterAndSortTasks } from "../../js/filter";
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

    $: $todoistData, updatePage();

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
            const tasksForTomorrow = getTasksForDate(now, $todoistData);

            todayTasks = [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks];
        }

        ({ tasksWithNoTime, tasks } = targetDate
            ? getTasksForDate(targetDate, $todoistData)
            : { tasks: [], tasksWithNoTime: [] });

        if (tasksWithNoTime.length > 2) {
            tasksWithNoTime = filterAndSortTasks(tasksWithNoTime, $todoistData.contexts, false);
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
        const context = $todoistData.contexts.find((context) => context.id === id);
        return context?.color || null;
    }

    function getGradientColor() {
        const gradientBlue = "bg-gradient-to-r from-blue-900 to-blue-700";
        const gradientGreen = "bg-gradient-to-r from-green-900 to-green-700";
        const gradientDarkGreen = "bg-gradient-to-r from-emerald-900 to-emerald-700";
        const gradientOrange = "bg-gradient-to-r from-orange-800 to-orange-600";
        const gradientRed = "bg-gradient-to-r from-red-900 to-red-700";

        if (window.location.hash === "#tomorrow") {
            const totalTasks =
                (tasks?.length || 0) + (tasksWithNoTime?.length || 0) + (todayTasks?.length || 0);

            switch (true) {
                case totalTasks > 20:
                    return gradientRed;
                case totalTasks >= 19:
                    return gradientOrange;
                case totalTasks >= 17:
                    return null;
                case totalTasks >= 15:
                    return gradientDarkGreen;
                case totalTasks >= 12:
                    return gradientGreen;
                case totalTasks < 12:
                    return gradientBlue;
                default:
                    return null;
            }
        } else if (window.location.hash === "#today") {
            const totalTasks = (tasks?.length || 0) + (tasksWithNoTime?.length || 0);
            const currentHour = new Date().getHours();
            const hourAdjustment = currentHour > 8 ? currentHour - 8 : 0;
            const todayThreshold = 14 - hourAdjustment;

            if (totalTasks < todayThreshold - 2) {
                return gradientBlue;
            } else if (totalTasks === todayThreshold - 2) {
                return gradientGreen;
            } else if (totalTasks === todayThreshold - 1) {
                return gradientDarkGreen;
            } else if (totalTasks === todayThreshold) {
                return null;
            } else if (totalTasks === todayThreshold + 1) {
                return gradientOrange;
            } else if (totalTasks > todayThreshold + 1) {
                return gradientRed;
            } else {
                return "";
            }
        } else {
            return "";
        }
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

<div class="mr-4 mt-[-2rem] max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
    <AgendaHeader {title} {tasks} {tasksWithNoTime} {todayTasks} {headerGradientColor} />

    {#if tasksWithNoTime.length > 0}
        <div class="mb-4 flex w-full flex-col items-center pl-[4.5rem] pr-2">
            {#each tasksWithNoTime as task}
                <AgendaTask {task} color={getTaskColor(task.contextId)} />
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
