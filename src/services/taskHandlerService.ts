import { DateTime } from "luxon";
import { markTaskDone, deferTasks } from "../services/apiService";
import { createDateWithTime } from "../utils/timeUtils";
import type { Task, TaskUpdates } from "../types/todoist";

/**
 * Marks a task as done and returns the updates needed for the store.
 * @param {Task} task - The task to mark as done.
 * @returns Promise&lt;{ success: boolean, taskUpdates: TaskUpdates }> - Object containing success status and task updates.
 */
export async function handleTaskDone(task: Task): Promise<{ success: boolean; taskId: string }> {
    const result = await markTaskDone(task.id);
    return { success: result.status === "success", taskId: task.id };
}

/**
 * Defers multiple tasks and updates the resources accordingly.
 * @param {Array<[Task, DateTime]>} taskUpdates - An array of [Task, DateTime] tuples.
 * @returns Promise&lt;boolean> - True if all tasks were deferred successfully, false otherwise.
 */
export async function handleTaskDefer(
    taskUpdates: Array<[Task, DateTime]>,
): Promise<{ success: boolean; taskUpdates: TaskUpdates }> {
    const updatedTaskResources: Array<[string, DateTime]> = taskUpdates.map(([task, dateTime]) => [
        task.id,
        dateTime,
    ]);
    const results = await deferTasks(taskUpdates);
    const errors = results.filter((result) => result.status === "error");

    return { success: errors.length === 0, taskUpdates: updatedTaskResources };
}

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
