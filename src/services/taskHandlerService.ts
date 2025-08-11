import { DateTime } from "luxon";
import { todoistData, taskActivity } from "../stores/stores";
import { markTaskDone, deferTasks } from "../services/apiService";
import { error } from "../services/toastService";
import { updateFirstDueTask } from "../services/firstTaskService";
import type { Task, TodoistData, TaskUpdates } from "../types/todoist";
import type { TaskActivity } from "../types/activity";

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
                const newDueDate = new Date(time instanceof DateTime ? time.toJSDate() : time);
                if (task.due) {
                    task.due.date = newDueDate.toISOString();
                }

                $resources.dueTasks.splice(index, 1);

                if (newDueDate < new Date()) {
                    const insertIndex = $resources.dueTasks.findIndex(
                        (t) => t.due && new Date(t.due.date) > newDueDate,
                    );
                    const actualInsertIndex =
                        insertIndex === -1 ? $resources.dueTasks.length : insertIndex;
                    $resources.dueTasks.splice(actualInsertIndex, 0, task);
                }
            }
        });

        return $resources;
    });

    void updateFirstDueTask();
}

/**
 * Marks a task as done and updates the resources accordingly.
 * @param {Task} task - The task to mark as done.
 * @returns Promise&lt;void>
 */
export async function handleTaskDone(task: Task): Promise<void> {
    const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });

    const newActivityEntry: TaskActivity = {
        date: DateTime.now(),
        taskId: task.id,
        contextId: task.contextId || "inbox",
        title: task.content,
        temporary: true,
    };
    taskActivity.update((activities) => [...activities, newActivityEntry]);

    updateTaskResources([[task.id, fiveMinutesFromNow]]);

    const result = await markTaskDone(task.id);
    if (result.status === "error") {
        const message = typeof result.error === "string" ? result.error : result.error.message;
        error(`Failed to mark task done: ${message}`);
    }
}

/**
 * Defers multiple tasks and updates the resources accordingly.
 * @param {Array<[Task, DateTime]>} taskUpdates - An array of [Task, DateTime] tuples.
 * @returns Promise&lt;void>
 */
export async function handleTaskDefer(taskUpdates: Array<[Task, DateTime]>): Promise<void> {
    const updatedTaskResources: Array<[string, DateTime]> = taskUpdates.map(([task, dateTime]) => [
        task.id,
        dateTime,
    ]);
    updateTaskResources(updatedTaskResources);

    const results = await deferTasks(taskUpdates);
    const errors = results.filter((result) => result.status === "error");

    if (errors.length > 0) {
        const errorMessages = errors
            .map((error) => {
                if ("error" in error) {
                    return typeof error.error === "string" ? error.error : error.error.message;
                }
                return "Unknown error";
            })
            .join(", ");
        error(`Failed to defer tasks: ${errorMessages}`);
    }
}
