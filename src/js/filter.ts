import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistData } from "../stores/stores";
import { getTaskTime } from "./time";
import type { Task, Context, DueTasksData, TasksGroupedByContext } from "../types/todoist";

/**
 * Returns the list of due tasks, filtered and sorted.
 * @param {DueTasksData} data - The data object containing tasks, contexts, and user.
 * @returns {Task[]} The filtered and sorted due tasks.
 */
export function getDueTasks(data: DueTasksData): Task[] {
    const { tasks, contexts, user } = data;
    const timeZone = user?.tz_info?.timezone || "local";

    return filterAndSortTasks(tasks, contexts, { timeZone });
}

/**
 * Returns the list of reverse tasks, filtered and sorted in reverse order.
 * @param {DueTasksData} data - The data object containing tasks, contexts, and user.
 * @returns {Task[]} The filtered and reverse-sorted tasks.
 */
export function getReverseTasks(data: DueTasksData): Task[] {
    const { tasks, contexts, user } = data;
    const timeZone = user?.tz_info?.timezone || "local";

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

    const date = reverse ? DateTime.now().plus({ days: 1 }).endOf("day").toJSDate() : new Date();

    const filteredTasks = timeZone ? filterDueTasks(tasks, timeZone, date) : tasks;

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
export function createContextLookup(contexts: Context[]): Record<string, number> {
    return contexts.reduce((acc: Record<string, number>, context: Context) => {
        acc[context.id] = context.childOrder;
        return acc;
    }, {});
}

/**
 * Filters tasks to only those that are due.
 * @param {Task[]} tasks - The list of tasks.
 * @param {string} timeZone - The time zone to use for date comparisons.
 * @param {Date} date - The date used for comparison.
 * @returns {Task[]} The filtered due tasks.
 */
export function filterDueTasks(tasks: Task[], timeZone: string, date: Date): Task[] {
    return tasks.filter((task) => processDueProperties(task, timeZone, date));
}

/**
 * Processes the due properties of a task and determines if it is due.
 * @param {Task} task - The task to process.
 * @param {string} timeZone - The time zone to use for date comparisons.
 * @param {Date} date - The date used for comparison.
 * @returns {boolean} True if the task is due, false otherwise.
 */
export function processDueProperties(task: Task, timeZone: string, date: Date): boolean {
    if (!task.due) {
        return false;
    }

    task.due.extractedTime = getTaskTime(task.due.string);
    task.due.allDay = task.due.date && !task.due.extractedTime ? 1 : 0;
    task.due.dateObject = DateTime.fromISO(task.due.datetime || task.due.date, {
        zone: timeZone,
    }).toJSDate();
    return task.due.dateObject < date;
}

/**
 * Compares two tasks by priority.
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @returns {number} The comparison result.
 */
function compareByPriority(a: Task, b: Task): number {
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
 * @param {Task} a - The first task.
 * @param {Task} b - The second task.
 * @param {Record<string, number>} contextLookup - The context lookup object.
 * @param {string} [timeZone] - The time zone to use for date comparisons.
 * @param {boolean} [reverse] - Whether to reverse the sort order. Defaults to false.
 * @returns {number} The comparison result.
 */
export function compareTasks(
    a: Task,
    b: Task,
    contextLookup: Record<string, number>,
    timeZone?: string,
    reverse: boolean = false,
): number {
    const applyReverse = (val: number) => (reverse ? -val : val);

    const comparisons = [
        () => compareByPriority(a, b),
        () => compareByContext(a, b, contextLookup),
        () => (timeZone ? compareByDueDate(a, b, timeZone) : 0),
    ];

    const result = comparisons.reduce((acc, comparison) => acc || comparison(), 0);

    return applyReverse(result);
}

/**
 * Groups tasks by their context and counts priorities.
 * @returns {TasksGroupedByContext} An object mapping context IDs to task counts and priority breakdowns.
 */
export function getTasksGroupedByContext(): TasksGroupedByContext {
    const $todoistData = get(todoistData);
    return ($todoistData?.dueTasks ?? []).reduce((acc: TasksGroupedByContext, task: Task) => {
        const context = acc[task.contextId as string] ?? { total: 0, priorities: {}, tasks: [] };
        context.total++;
        context.priorities[task.priority] = (context.priorities[task.priority] ?? 0) + 1;
        context.tasks.push(task); // Add the task object
        acc[task.contextId as string] = context;
        return acc;
    }, {} as TasksGroupedByContext);
}
