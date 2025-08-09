<script lang="ts">
    import { DateTime } from "luxon";
    import { getTasksForMonth } from "../../utils/deferDateUtils";
    import { getPriorityClasses } from "../../utils/styleUtils";
    import { compareByPriority } from "../../utils/comparisonUtils";
    import Calendar from "../interface/Calendar.svelte";
    import type { Task, Priority } from "../../types/todoist";
    import type { DatePickerProps } from "../../types/defer";

    let { taskToDefer, tz, tasks, onDefer }: DatePickerProps = $props();

    let dateInfo = $derived(
        (() => {
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
                        acc[date].dots.push({
                            color: getPriorityClasses(task.priority as Priority),
                        });
                        acc[date].tasks.push(task);
                    }
                    return acc;
                },
                {} as Record<string, { dots: { color: string }[]; tasks: Task[] }>,
            );
        })(),
    );
</script>

<Calendar
    {dateInfo}
    onDayClick={(day: DateTime) => {
        const isoDate = day.toISODate();
        if (isoDate) {
            onDefer({ rawTime: isoDate });
        }
    }}
    disable="past"
/>
