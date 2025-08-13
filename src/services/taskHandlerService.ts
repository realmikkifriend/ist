import { DateTime } from "luxon";
import { markTaskDone, deferTasks } from "../services/apiService";
import type { Task, TodoistData, TaskUpdates } from "../types/todoist";

/**
 * Calculates the updated TodoistData based on the provided task updates.
 * @param {TodoistData} currentResources - The current TodoistData from the store.
 * @param {TaskUpdates} taskUpdates - Task updates as an array of [taskID, newDueDate] tuples. NewDueDate can be a Date, DateTime, or string.
 * @returns {TodoistData} - The updated TodoistData.
 */
export function calculateUpdatedTaskResources(
    currentResources: TodoistData,
    taskUpdates: TaskUpdates,
): TodoistData {
    const newResources = { ...currentResources, dueTasks: [...currentResources.dueTasks] }; // Create a mutable copy

    taskUpdates.sort(
        ([, timeA], [, timeB]) =>
            new Date(timeA as Date).getTime() - new Date(timeB as Date).getTime(),
    );

    taskUpdates.forEach(([taskID, time]) => {
        const index = newResources.dueTasks.findIndex((task) => task.id === taskID);
        if (index !== -1) {
            const task = { ...newResources.dueTasks[index] }; // Create a mutable copy of the task
            const newDueDate = new Date(time instanceof DateTime ? time.toJSDate() : time);
            if (task.due) {
                task.due = { ...task.due, date: newDueDate.toISOString() }; // Create a mutable copy of due
            }

            newResources.dueTasks.splice(index, 1);

            const insertIndex = newResources.dueTasks.findIndex(
                (t) => t.due && new Date(t.due.date) > newDueDate,
            );

            const actualInsertIndex =
                insertIndex === -1 ? newResources.dueTasks.length : insertIndex;

            newResources.dueTasks.splice(actualInsertIndex, 0, task);
        }
    });

    return newResources;
}

/**
 * Marks a task as done and returns the updates needed for the store.
 * @param {Task} task - The task to mark as done.
 * @returns Promise&lt;{ success: boolean, taskUpdates: TaskUpdates }> - Object containing success status and task updates.
 */
export async function handleTaskDone(
    task: Task,
): Promise<{ success: boolean; taskUpdates: TaskUpdates }> {
    const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });
    const taskUpdates: TaskUpdates = [[task.id, fiveMinutesFromNow]];

    const result = await markTaskDone(task.id);
    return { success: result.status === "success", taskUpdates };
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
