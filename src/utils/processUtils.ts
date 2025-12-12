import { DateTime } from "luxon";
import {
    CONTEXT_PROPS_TO_REMOVE,
    TASK_PROPS_TO_REMOVE,
    TASK_RENAME_MAP,
    USER_PROPS_TO_REMOVE,
} from "./dataCleaningConstants";
import { getDueTasks } from "./filterUtils";
import type {
    CleanableTodoistData,
    TodoistData,
    Context,
    Task,
    User,
    TaskUpdates,
} from "../types/todoist";

/**
 * Removes specified properties from each object in the array and optionally renames properties.
 * @template T
 * @param {T[]} dataArray - Array of objects to clean.
 * @param {string[]} propsToRemove - Properties to remove from each object.
 * @param {Record<string, string>} renameMap - Map of properties to rename (oldName: newName).
 * @returns {Partial<T>[]} - Array of cleaned objects.
 */
function cleanDataArray<T extends object>(
    dataArray: T[],
    propsToRemove: string[],
    renameMap: Record<string, string> = {},
): Partial<T>[] {
    return dataArray.map((item) => {
        const result: Partial<T> = { ...item };
        return propsToRemove.reduce((acc, prop) => {
            if (Object.prototype.hasOwnProperty.call(acc, prop)) {
                if (renameMap[prop]) {
                    (acc as Record<string, unknown>)[renameMap[prop]] = (
                        acc as Record<string, unknown>
                    )[prop];
                }
                delete (acc as Record<string, unknown>)[prop];
            }
            return acc;
        }, result);
    });
}

/**
 * Cleans Todoist data by removing unnecessary properties and renaming as needed.
 * @param {CleanableTodoistData} data - The Todoist data object to clean.
 * @returns {CleanableTodoistData} - The cleaned data object.
 */
export function cleanTodoistData(data: CleanableTodoistData): CleanableTodoistData {
    if (data.tasks) {
        data.tasks = cleanDataArray(
            data.tasks,
            TASK_PROPS_TO_REMOVE,
            TASK_RENAME_MAP,
        ) as unknown as Task[];
    }

    if (data.contexts) {
        data.contexts = cleanDataArray(
            data.contexts,
            CONTEXT_PROPS_TO_REMOVE,
        ) as unknown as Context[];
    }

    if (data.user) {
        data.user = cleanDataArray([data.user], USER_PROPS_TO_REMOVE)[0] as unknown as User;
    }

    return data;
}

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
    const updatedTasks = currentResources.tasks
        .filter((task) => !removedTaskIds.includes(task.id))
        .map((task): Task => {
            const updatedDueDate = taskUpdates.find(([taskId]) => taskId === task.id)?.[1];
            if (updatedDueDate && task.due) {
                const newDueDate =
                    updatedDueDate instanceof DateTime
                        ? updatedDueDate
                        : updatedDueDate instanceof Date
                          ? DateTime.fromJSDate(updatedDueDate)
                          : DateTime.fromISO(updatedDueDate);

                return {
                    ...task,
                    due: {
                        ...task.due,
                        date: newDueDate.toISO()!,
                        string: task.due.string || newDueDate.toISO()!,
                    },
                };
            }
            return task;
        });

    const updatedTodoistData = { ...currentResources, tasks: updatedTasks };
    const newDueTasks = getDueTasks(updatedTodoistData);

    return { ...updatedTodoistData, dueTasks: newDueTasks };
}

/**
 * Extracts user data from the API response.
 * @param {unknown} userResponse - User data retrieved from API.
 * @returns {User | undefined} Processed user data.
 */
export function extractUser(userResponse: unknown): User | undefined {
    return userResponse && typeof userResponse === "object" && "tz_info" in userResponse
        ? (userResponse as User)
        : undefined;
}
