import { DateTime } from "luxon";
import { getTaskTime } from "./time";
import type { Task, Context, DueTasksData } from "../../types/todoist";

/**
 * Returns the list of due tasks, filtered and sorted.
 * @param {DueTasksData} data - The data object containing tasks, contexts, and user.
 * @returns {Task[]} The filtered and sorted due tasks.
 */
export function getDueTasks(data: DueTasksData): Task[] {
    const { tasks, contexts, user } = data;
    const timeZone = user?.tz_info?.name || "local";

    return filterAndSortTasks(tasks, contexts, { timeZone });
}

/**
 * Returns the list of reverse tasks, filtered and sorted in reverse order.
 * @param {DueTasksData} data - The data object containing tasks, contexts, and user.
 * @returns {Task[]} The filtered and reverse-sorted tasks.
 */
export function getReverseTasks(data: DueTasksData): Task[] {
    const { tasks, contexts, user } = data;
    const timeZone = user?.tz_info?.name || "local";

    return filterAndSortTasks(tasks, contexts, { timeZone, reverse: true });
}

/**
 * Filters and sorts tasks based on due date, context, and priority.
 * @param {Task[]} tasks - The list of tasks.
 * @param {Context[]} contexts - The list of contexts.
 * @param {object} options - Options for filtering and sorting.
 * @param {string} [options.timeZone] - The time zone to use for date comparisons.
 * @param {boolean} [options.reverse] - Whether to reverse the sort order. Defaults to false.
 * @returns {Task[]} The filtered and sorted tasks.
 */
export function filterAndSortTasks(
    tasks: Task[],
    contexts: Context[],
    options: { timeZone?: string; reverse?: boolean } = {},
): Task[] {
    const { timeZone, reverse = false } = options;
    const contextLookup = createContextLookup(contexts);

    const filteredTasks = timeZone ? filterDueTasks(tasks, timeZone) : tasks;

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        return compareTasks(a, b, contextLookup, timeZone, reverse);
    });
    return sortedTasks;
}

/**
 * Creates a lookup object for context child order.
 * @param {Context[]} contexts - The list of contexts.
 * @returns {Record<string, number>} The context lookup object.
 */
function createContextLookup(contexts: Context[]): Record<string, number> {
    return contexts.reduce((acc: Record<string, number>, context: Context) => {
        acc[context.id] = context.childOrder;
        return acc;
    }, {});
}

/**
 * Filters tasks to only those that are due.
 * @param {Task[]} tasks - The list of tasks.
 * @param {string} timeZone - The time zone to use for date comparisons.
 * @returns {Task[]} The filtered due tasks.
 */
function filterDueTasks(tasks: Task[], timeZone: string): Task[] {
    return tasks.filter((task) => processDueProperties(task, timeZone));
}

/**
 * Processes the due properties of a task and determines if it is due.
 * @param {Task} task - The task to process.
 * @param {string} timeZone - The time zone to use for date comparisons.
 * @returns {boolean} True if the task is due, false otherwise.
 */
function processDueProperties(task: Task, timeZone: string): boolean {
    if (!task.due) {
        return false;
    }

    task.due.extractedTime = getTaskTime(task.due.string);
    task.due.allDay = task.due.date && !task.due.extractedTime ? 1 : 0;
    task.due.dateObject = DateTime.fromISO(task.due.datetime || task.due.date, {
        zone: timeZone,
    }).toJSDate();
    return task.due.dateObject < new Date();
}

/**
 * Compares two tasks for sorting.
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @param {Record<string, number>} contextLookup - The context lookup object.
 * @param {string} [timeZone] - The time zone to use for date comparisons.
 * @param {boolean} [reverse] - Whether to reverse the sort order. Defaults to false.
 * @returns {number} The comparison result.
 */
function compareTasks(
    a: Task,
    b: Task,
    contextLookup: Record<string, number>,
    timeZone?: string,
    reverse: boolean = false,
): number {
    const [first, second] = reverse ? [a, b] : [b, a];

    if (first.priority !== second.priority) {
        return first.priority - second.priority;
    }

    const orderA = contextLookup[a.contextId ?? ""] || 0;
    const orderB = contextLookup[b.contextId ?? ""] || 0;
    if (orderA !== orderB) {
        return reverse ? orderB - orderA : orderA - orderB;
    }

    if (!timeZone) return 0;

    if (!a.due || !b.due) return 0;

    const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone }).toJSDate();
    const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone }).toJSDate();
    return dateA.getTime() - dateB.getTime();
}
