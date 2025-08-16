import { DateTime } from "luxon";
import { markTaskDone, deferTasks } from "../services/apiService";
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
