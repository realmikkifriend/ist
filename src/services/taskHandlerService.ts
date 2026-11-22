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
    if (task.due?.isRecurring) {
        const today = DateTime.now().startOf("day");
        const { newDate } = createDateWithTime(task.due.string, today);
        const deferTime = newDate ?? today;
        await handleTaskDefer([[task, deferTime]]);
    }
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
 * @returns {Promise<TaskUpdates | null>} - The updates applied to the tasks, or null if none.
 */
export async function handleOverdueTasks(tasks: Task[]): Promise<TaskUpdates | null> {
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

        const result = await handleTaskDefer(taskUpdates);
        return result.taskUpdates;
    }
    return null;
}

/**
 * Defers the given tasks to the target day, preserving each task's time of day.
 * Tasks with a timed due date (due.date contains "T") are moved to the same
 * hour:minute on the target day; tasks with an all-day due date become all-day
 * on the target day.
 * @param {Task[]} tasks - The tasks whose due dates move to the target day.
 * @param {DateTime} targetDay - The day to defer to (e.g. start of today).
 * @returns Promise&lt;{ success: boolean; taskUpdates: TaskUpdates }> - True if all defers succeeded, plus the applied [taskId, newDueDateTime] updates.
 */
export async function deferTasksToDay(
    tasks: Task[],
    targetDay: DateTime,
): Promise<{ success: boolean; taskUpdates: TaskUpdates }> {
    const startOfTargetDay = targetDay.startOf("day");
    const taskUpdates: [Task, DateTime][] = tasks.map((task) => {
        const due = task.due?.date ?? "";
        const dueTime = due.includes("T") ? DateTime.fromISO(due) : null;
        const time: DateTime = dueTime
            ? startOfTargetDay.plus({ hours: dueTime.hour, minutes: dueTime.minute })
            : startOfTargetDay;
        return [task, time];
    });
    return handleTaskDefer(taskUpdates);
}
