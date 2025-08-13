import { DateTime } from "luxon";
import { markTaskDone, deferTasks } from "../services/apiService";
import type { Task, TodoistData, TaskUpdates } from "../types/todoist";

/**
 * Calculates the updated TodoistData based on the provided task updates.
 * @param {TodoistData} currentResources - The current TodoistData from the store.
 * @param {TaskUpdates} taskUpdates - Task updates as an array of [taskID, newDueDate] tuples. NewDueDate can be a Date, DateTime, or string.
 * @param {string[]} removedTaskIds - IDs of tasks to be removed.
 * @returns {TodoistData} - The updated TodoistData.
 */
export function calculateUpdatedTaskResources(
    currentResources: TodoistData,
    taskUpdates: TaskUpdates,
    removedTaskIds: string[] = [],
): TodoistData {
    const today = DateTime.now().startOf("day");

    const updatedDueDates = new Map<string, DateTime>(
        taskUpdates.map(([taskId, newTime]) => [
            taskId,
            newTime instanceof DateTime
                ? newTime
                : newTime instanceof Date
                  ? DateTime.fromJSDate(newTime)
                  : DateTime.fromISO(newTime),
        ]),
    );

    const newDueTasks = currentResources.dueTasks
        .filter((task) => !removedTaskIds.includes(task.id))
        .map((task) => {
            if (updatedDueDates.has(task.id)) {
                const newDueDate = updatedDueDates.get(task.id)!;
                if (newDueDate.startOf("day") > today) {
                    return null;
                }
                const updatedTask = { ...task };
                if (updatedTask.due) {
                    updatedTask.due = { ...updatedTask.due, date: newDueDate.toISO()! };
                }
                return updatedTask;
            }
            return task;
        })
        .filter((task) => task !== null);

    newDueTasks.sort((a, b) => {
        const dateA = a.due ? new Date(a.due.date).getTime() : Infinity;
        const dateB = b.due ? new Date(b.due.date).getTime() : Infinity;
        return dateA - dateB;
    });

    return { ...currentResources, dueTasks: newDueTasks };
}

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
