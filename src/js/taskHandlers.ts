import { todoistData, todoistError, previousFirstDueTask } from "./stores";
import { markTaskDone, deferTasks, refreshData } from "./api";
import { updateFirstDueTask } from "./first";
import { get } from "svelte/store";
import { DateTime } from "luxon";
import { TodoistRequestError } from "@doist/todoist-api-typescript";
import type { Task, TodoistData } from "../../types/todoist";

type TaskUpdates = Array<[string, Date | DateTime | string]>;

/**
 * Updates the dueTasks resource in the todoistData store based on the provided task updates.
 * @param {TaskUpdates} taskUpdates - Task updates as an array of [taskID, newDueDate] tuples. newDueDate can be a Date, DateTime, or string.
 * @returns {void}
 */
export function updateTaskResources(taskUpdates: TaskUpdates): void {
    todoistData.update(($resources: TodoistData) => {
        taskUpdates.sort(
            ([, timeA], [, timeB]) =>
                new Date(timeA as Date).getTime() - new Date(timeB as Date).getTime(),
        );

        taskUpdates.forEach(([taskID, time]) => {
            const index = $resources.dueTasks.findIndex((task) => task.id === taskID);
            if (index !== -1) {
                const task = $resources.dueTasks[index];
                const prevFirstDueTask = get(previousFirstDueTask);

                const newDueDate = new Date(time instanceof DateTime ? time.toJSDate() : time);
                if (task.due) {
                    task.due.date = newDueDate.toISOString();
                }

                $resources.dueTasks.splice(index, 1);

                if (prevFirstDueTask && index === 0) {
                    previousFirstDueTask.set(null);
                }

                if (newDueDate < new Date()) {
                    const insertIndex = $resources.dueTasks.findIndex(
                        (t) => t.due && new Date(t.due.date) > newDueDate,
                    );
                    if (insertIndex === -1) {
                        $resources.dueTasks.push(task);
                    } else {
                        $resources.dueTasks.splice(insertIndex, 0, task);
                    }
                }
            }
        });

        return $resources;
    });

    void updateFirstDueTask();
}

/**
 * Marks a task as done and updates the resources accordingly.
 * @param {string} taskID - The ID of the task to mark as done.
 * @returns Promise&lt;void>
 */
export async function handleTaskDone(taskID: string): Promise<void> {
    previousFirstDueTask.set(null);

    const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });

    updateTaskResources([[taskID, fiveMinutesFromNow]]);

    const result = await markTaskDone(taskID).catch((error: unknown) => {
        const message = error instanceof TodoistRequestError ? error.message : "Unknown error";
        todoistError.set(`Failed to mark task done: ${message}`);
        return null;
    });
    if (!result) return;

    void refreshData();
}

/**
 * Defers multiple tasks and updates the resources accordingly.
 * @param {Array<[Task, DateTime]>} taskUpdates - An array of [Task, DateTime] tuples.
 * @returns Promise&lt;void>
 */
export async function handleTaskDefer(taskUpdates: Array<[Task, DateTime]>): Promise<void> {
    previousFirstDueTask.set(null);

    const updatedTaskResources: Array<[string, DateTime]> = taskUpdates.map(([task, dateTime]) => [
        task.id,
        dateTime,
    ]);
    updateTaskResources(updatedTaskResources);

    const result = await deferTasks(taskUpdates).catch((error: unknown) => {
        const message = error instanceof TodoistRequestError ? error.message : "Unknown error";
        todoistError.set(`Failed to defer tasks: ${message}`);
        return null;
    });
    if (!result) return;

    void refreshData();
}
