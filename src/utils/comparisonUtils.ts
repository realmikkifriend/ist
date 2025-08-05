import { DateTime } from "luxon";
import type { Task } from "../types/todoist";

/**
 * Compares two tasks by priority.
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @returns {number} The comparison result.
 */
export function compareByPriority(a: Task, b: Task): number {
    return b.priority - a.priority;
}

/**
 * Compares two tasks by context.
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @param {Record<string, number>} contextLookup - The context lookup object.
 * @returns {number} The comparison result.
 */
function compareByContext(a: Task, b: Task, contextLookup: Record<string, number>): number {
    const aHasContext = Boolean(a.contextId);
    const bHasContext = Boolean(b.contextId);

    if (aHasContext !== bHasContext) {
        return aHasContext ? 1 : -1;
    }

    if (aHasContext && bHasContext) {
        const orderA = contextLookup[a.contextId!];
        const orderB = contextLookup[b.contextId!];
        if (orderA !== orderB) {
            return orderA - orderB;
        }
    }

    return 0;
}

/**
 * Compares two tasks by due date.
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @param {string} timeZone - The time zone to use for date comparisons.
 * @returns {number} The comparison result.
 */
function compareByDueDate(a: Task, b: Task, timeZone: string): number {
    if (!a.due || !b.due) {
        return 0;
    }

    const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone });
    const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone });

    return dateA.toMillis() - dateB.toMillis();
}

/**
 * Compares two tasks for sorting.
 * @param {object} tasks - The object containing two tasks to compare.
 * @param {Task} tasks.a - The first task.
 * @param {Task} tasks.b - The second task.
 * @param {Record<string, number>} contextLookup - The context lookup object.
 * @param {string} [timeZone] - The time zone to use for date comparisons.
 * @param {boolean} [reverse] - Whether to reverse the sort order. Defaults to false.
 * @returns {number} The comparison result.
 */
export function compareTasks(
    tasks: { a: Task; b: Task },
    contextLookup: Record<string, number>,
    timeZone?: string,
    reverse: boolean = false,
): number {
    const { a, b } = tasks;
    const applyReverse = (val: number) => (reverse ? -val : val);

    const priorityComparison = () => compareByPriority(a, b);
    const contextComparison = () => compareByContext(a, b, contextLookup);

    const comparisons = [
        ...(reverse
            ? [priorityComparison, contextComparison]
            : [contextComparison, priorityComparison]),
        () => (timeZone ? compareByDueDate(a, b, timeZone) : 0),
    ];

    const result = comparisons.reduce((acc, comparison) => acc || comparison(), 0);

    return applyReverse(result);
}
