<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import { getGradientColor } from "../../js/classes";
    import { filterAndSortTasks } from "../../js/filter";
    import { getTasksForDate, sortAgendaTasks } from "./agenda";
    import AgendaHeader from "./AgendaHeader.svelte";
    import AgendaHour from "./AgendaHour.svelte";
    import AgendaTask from "./AgendaTask.svelte";
    import type { Writable } from "svelte/store";
    import type { AgendaData } from "../../../types/agenda";
    import type { Task, Context, ColorName } from "../../../types/todoist";

    const agendaStore: Writable<AgendaData> = writable({
        tasks: [],
        tasksForDate: [],
        tasksWithNoTime: [],
        todayTasks: [],
    });

    const hourSlots: number[] = Array.from({ length: 18 }, (_, i) => i + 6);

    $: if ($todoistData) updatePage();

    /**
     * Returns the current agenda title based on the window hash.
     * @returns Agenda title to display.
     */
    const getTitle = (): string => {
        return window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
    };

    /**
     * Computes the header gradient color based on the number of tasks and the current hash.
     * @param agendaData - Information on tasks for calculations.
     * @returns Tailwind classes of header gradient.
     */
    function computeHeaderGradientColor(agendaData: AgendaData): string {
        const totalTasks =
            (agendaData.tasks?.length || 0) +
            (agendaData.tasksWithNoTime?.length || 0) +
            (window.location.hash === "#tomorrow" ? agendaData.todayTasks?.length || 0 : 0);

        return getGradientColor(totalTasks, window.location.hash ?? "") ?? "";
    }

    /**
     * Determines which hours should be displayed in the agenda.
     * @param agendaData - Information on tasks for calculations.
     * @param now - Current date-time object.
     * @param hourSlots - List of hours to check.
     * @returns Object of hours to display.
     */
    function getDisplayHours(
        agendaData: AgendaData,
        now: DateTime,
        hourSlots: number[],
    ): Record<number, boolean> {
        if (getTitle() === "Today") {
            const result: Record<number, boolean> = {};
            hourSlots.forEach((hour) => {
                const hourTasks = agendaData.tasks.filter(
                    (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
                );
                result[hour] = hour >= now.hour || hourTasks.length > 0;
            });
            return result;
        } else {
            const result: Record<number, boolean> = {};
            hourSlots.forEach((hour) => (result[hour] = true));
            return result;
        }
    }

    /**
     * Updates the agenda page data based on the current hash and todoist data.
     */
    const updatePage = (): void => {
        const now = DateTime.now();

        const targetDate =
            window.location.hash === "#today"
                ? now
                : window.location.hash === "#tomorrow"
                  ? now.plus({ days: 1 })
                  : null;

        const tasksForDate: Task[] = targetDate ? getTasksForDate(targetDate, $todoistData) : [];
        const sortedTasks = targetDate
            ? sortAgendaTasks(tasksForDate)
            : { tasksWithNoTime: [], tasks: [] };

        const tasksForTomorrow =
            window.location.hash === "#tomorrow"
                ? sortAgendaTasks(getTasksForDate(now, $todoistData))
                : { tasksWithNoTime: [], tasks: [] };

        const tasksWithNoTime: Task[] =
            sortedTasks.tasksWithNoTime.length > 2
                ? filterAndSortTasks(sortedTasks.tasksWithNoTime, $todoistData.contexts)
                : sortedTasks.tasksWithNoTime;

        const tasks: Task[] = sortedTasks.tasks;
        const todayTasks: Task[] =
            window.location.hash === "#tomorrow"
                ? [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks]
                : [];

        const newAgendaData: AgendaData = {
            tasks,
            tasksForDate: tasksForDate,
            tasksWithNoTime,
            todayTasks,
        };

        agendaStore.set(newAgendaData);
    };

    /**
     * Gets the color for a given context ID.
     * @param id - ID of given context.
     * @returns ColorName corresponding to given context, or undefined.
     */
    function getTaskColor(id?: string): ColorName | undefined {
        if (!id) return undefined;
        const context: Context | undefined = $todoistData.contexts.find(
            (context) => context.id === id,
        );
        return context?.color as ColorName | undefined;
    }

    onMount(() => {
        if ($todoistData.tasks) {
            $todoistData.tasks.forEach((task: Task) => {
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
    <div class="-mt-8 mr-4 max-w-lg sm:mx-auto sm:max-w-96" id="agenda">
        <AgendaHeader
            agendaData={$agendaStore}
            displayData={{
                title: getTitle(),
                headerGradientColor: computeHeaderGradientColor($agendaStore),
            }}
        />

        {#if $agendaStore.tasksWithNoTime.length > 0}
            <div class="mb-4 flex w-full flex-col items-center pr-2 pl-18">
                {#each $agendaStore.tasksWithNoTime as task (task.id)}
                    <AgendaTask {task} color={getTaskColor(task.contextId) ?? "berry_red"} />
                {/each}
            </div>
        {/if}

        <div class="w-[99%] overflow-hidden pr-1">
            {#key (DateTime.now().hour, $agendaStore.tasks)}
                {#each hourSlots as hour (hour)}
                    {#if getDisplayHours($agendaStore, DateTime.now(), hourSlots)[hour]}
                        <AgendaHour
                            title={getTitle()}
                            {hour}
                            now={DateTime.now()}
                            tasks={$agendaStore.tasks.filter(
                                (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
                            )}
                        />
                    {/if}
                {/each}
            {/key}
        </div>
    </div>
{/key}
