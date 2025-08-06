<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import { getTasksForMonth } from "../../utils/deferDateUtils";
    import { getPriorityClasses } from "../../utils/styleUtils";
    import { compareByPriority } from "../../utils/comparisonUtils";
    import Calendar from "../interface/Calendar.svelte";
    import type { Task, Priority } from "../../types/todoist";

    export let taskToDefer: Task;
    export let tz: string;
    export let tasks: Task[];

    const dispatch = createEventDispatcher<{ defer: { rawTime: string } }>();

    /**
     * Handles the defer event from the date picker.
     * @param day - The day to defer to.
     */
    const handleDefer = (day: DateTime): void => {
        const isoDate = day.toISODate();
        if (isoDate) {
            dispatch("defer", { rawTime: isoDate });
        }
    };

    $: dateInfo = (() => {
        const now = DateTime.now().setZone(tz);
        const monthTasks = getTasksForMonth(
            tasks,
            {
                start: now.startOf("month"),
                end: now.endOf("month"),
            },
            {
                tz,
                contextId: taskToDefer.contextId ?? "",
                monthYear: now.toFormat("MMMM yyyy"),
                now,
                soonTasks: tasks,
            },
        );

        monthTasks.sort(compareByPriority);

        return monthTasks.reduce(
            (acc, task) => {
                if (task.due) {
                    const date = task.due.date;
                    if (!acc[date]) {
                        acc[date] = { dots: [], tasks: [] };
                    }
                    acc[date].dots.push({ color: getPriorityClasses(task.priority as Priority) });
                    acc[date].tasks.push(task);
                }
                return acc;
            },
            {} as Record<string, { dots: { color: string }[]; tasks: Task[] }>,
        );
    })();
</script>

<Calendar {dateInfo} onDayClick={handleDefer} disable="past" />
