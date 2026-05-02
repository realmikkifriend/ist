<script lang="ts">
    import { DateTime } from "luxon";
    import { getTasksForMonth } from "../../utils/deferDateUtils";
    import { compareByPriority } from "../../utils/comparisonUtils";
    import { getPriorityClasses } from "../../styles/styleUtils";
    import Calendar from "../interface/Calendar.svelte";
    import type { Task, Priority } from "../../types/todoist";
    import type { DatePickerProps } from "../../types/defer";

    let { task, tz, tasks, onDefer }: DatePickerProps = $props();

    let displayDate = $state(DateTime.now().setZone(tz));

    let dateInfo = $derived(
        (() => {
            const start = displayDate.startOf("month");

            const endOfMonth = displayDate.endOf("month");
            const endOfMonthWeekday = endOfMonth.weekday;
            const trailingDaysCount = 7 - endOfMonthWeekday + 7;
            const nextMonth = displayDate.plus({ months: 1 });
            const end = DateTime.local(nextMonth.year, nextMonth.month, trailingDaysCount).endOf(
                "day",
            );

            const monthTasks = getTasksForMonth(
                tasks,
                {
                    start,
                    end,
                },
                {
                    tz,
                    contextId: task.contextId ?? "",
                    monthYear: displayDate.toFormat("MMMM yyyy"),
                    now: displayDate,
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
    disable="past"
    onDayClick={(day: DateTime) => {
        const isoDate = day.toISODate();
        if (isoDate) {
            onDefer({ rawTime: isoDate });
        }
    }}
    bind:displayDate
/>
