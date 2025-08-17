import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { CalendarContext } from "../types/calendar";

/**
 * Filters tasks for those due within the given date range and context.
 * @param {Task[]} tasks - Array of tasks.
 * @param {object} dateRange - Start and end DateTimes.
 * @param {DateTime} dateRange.start - Start of the date range to retrieve tasks for.
 * @param {DateTime} dateRange.end - End of the date range to retrieve tasks for.
 * @param {CalendarContext} context - Object containing timezone and context ID.
 * @returns {Task[]} - An array of tasks with the given parameters.
 */
export function getTasksForMonth(
    tasks: Task[],
    dateRange: { start: DateTime; end: DateTime },
    context: CalendarContext,
): Task[] {
    return tasks.filter((task) => {
        if (!task.due) return false;
        const dueDate = DateTime.fromISO(task.due.date).setZone(context.tz);
        return (
            dueDate >= dateRange.start &&
            dueDate <= dateRange.end &&
            task.contextId === context.contextId
        );
    });
}
