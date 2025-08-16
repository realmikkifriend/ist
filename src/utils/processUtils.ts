import {
    CONTEXT_PROPS_TO_REMOVE,
    TASK_PROPS_TO_REMOVE,
    TASK_RENAME_MAP,
    USER_PROPS_TO_REMOVE,
} from "./dataCleaningConstants";
import type { CleanableTodoistData, Context, Task, User } from "../types/todoist";

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
