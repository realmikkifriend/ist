import { DateTime } from "luxon";
import { handleTaskDefer } from "../js/taskHandlers";
import { createDateWithTime } from "../utils/timeUtils";
import type { Task } from "../types/todoist";

/**
 * Handles overdue tasks by deferring them to today.
 * @param {Task[]} tasks - Array of Task objects to check for overdue status.
 * @returns {void}
 */
export function handleOverdueTasks(tasks: Task[]): void {
    const today = DateTime.now().startOf("day");
    const overdueTasks =
        tasks.filter((task) => {
            const dueDate = task.due?.date && DateTime.fromISO(task.due.date).startOf("day");
            return dueDate && dueDate < today;
        }) || [];

    if (overdueTasks.length > 0) {
        const taskUpdates: [Task, DateTime][] = overdueTasks.map((task) => {
            const extracted = task.due?.string ? createDateWithTime(task.due.string, today) : null;
            const time: DateTime = extracted?.newDate ?? today;
            return [task, time];
        });

        void handleTaskDefer(taskUpdates);
    }
}
