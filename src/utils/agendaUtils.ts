import { DateTime } from "luxon";
import { filterAndSortTasks } from "../utils/filterUtils";
import { compareByPriority } from "../utils/comparisonUtils";
import type { Task, TodoistData, Context } from "../types/todoist";
import type { AgendaData } from "../types/agenda";

/**
 * Get all tasks for a specific date.
 * @param {DateTime} date - The date to filter tasks for.
 * @param {TodoistData} todoistData - The Todoist data containing tasks.
 * @returns {Task[]} Array of tasks for the given date.
 */
export const getTasksForDate = (date: DateTime, todoistData: TodoistData): Task[] => {
    const startOfDay = date.startOf("day");
    const endOfDay = date.plus({ days: 1 }).startOf("day");

    return todoistData.tasks.filter((task: Task) => {
        if (!task.due) return false;
        const taskDate = DateTime.fromISO(task.due.date);
        return (
            task.due &&
            taskDate.toMillis() >= startOfDay.toMillis() &&
            taskDate.toMillis() < endOfDay.toMillis()
        );
    });
};

/**
 * Sort agenda tasks by due date and priority, and group by time presence.
 * @param {Task[]} tasks - The tasks to sort.
 * @returns {AgendaData} Sorted and grouped tasks.
 */
export const sortAgendaTasks = (tasks: Task[]): { tasksWithNoTime: Task[]; tasks: Task[] } => {
    const sorted = tasks.sort((a, b) => {
        const timeA = DateTime.fromISO(a.due?.date ?? "").toMillis();
        const timeB = DateTime.fromISO(b.due?.date ?? "").toMillis();

        if (timeA === timeB) {
            return compareByPriority(a, b);
        }
        return timeA - timeB;
    });

    const tasksWithTime = sorted.filter((task) => task.due?.date && task.due.date.includes("T"));
    const tasksWithNoTime = sorted.filter(
        (task) => !task.due?.date || !task.due.date.includes("T"),
    );

    return { tasksWithNoTime, tasks: tasksWithTime };
};

/**
 * Determines the target date based on the current window hash.
 * @param {DateTime} now - Current date-time object.
 * @returns {DateTime | null} The target date or null if no specific date is targeted.
 */
export const getTargetDate = (now: DateTime): DateTime | null => {
    if (window.location.hash === "#today") {
        return now;
    }
    if (window.location.hash === "#tomorrow") {
        return now.plus({ days: 1 });
    }
    return null;
};

/**
 * Retrieves and sorts tasks for a given date.
 * @param {DateTime | null} targetDate - The date to get tasks for.
 * @param {TodoistData} currentData - The current Todoist data.
 * @returns An object containing sorted tasks.
 */
export const getSortedTasksForDate = (
    targetDate: DateTime | null,
    currentData: TodoistData,
): { tasksWithNoTime: Task[]; tasks: Task[] } => {
    if (targetDate) {
        const tasksForDate = getTasksForDate(targetDate, currentData);
        return sortAgendaTasks(tasksForDate);
    }
    return { tasksWithNoTime: [], tasks: [] };
};

/**
 * Filters and sorts tasks with no time.
 * @param {Task[]} tasksNoTime - Tasks without a specific time.
 * @param {Context[]} contexts - User contexts for filtering.
 * @returns {Task[]} Filtered and sorted tasks.
 */
export const getFilteredTasksWithNoTime = (tasksNoTime: Task[], contexts: Context[]): Task[] => {
    return tasksNoTime.length > 2 ? filterAndSortTasks(tasksNoTime, contexts) : tasksNoTime;
};

/**
 * Computes today's tasks for the agenda, specifically when viewing tomorrow's agenda.
 * @param {{ tasksWithNoTime: Task[]; tasks: Task[] }} tasksForTomorrow - Sorted tasks for tomorrow.
 * @param { Task[] } tasksForTomorrow.tasksWithNoTime - The tasks with no set time.
 * @param { Task[] } tasksForTomorrow.tasks - The other tasks.
 * @returns {Task[]} Tasks filtered by day.
 */
export const getTodayTasksForAgenda = (tasksForTomorrow: {
    tasksWithNoTime: Task[];
    tasks: Task[];
}): Task[] => {
    if (window.location.hash === "#tomorrow") {
        return [...tasksForTomorrow.tasksWithNoTime, ...tasksForTomorrow.tasks];
    }
    return [];
};

function getTaskCountForHash(agendaData: AgendaData, currentHash: string): number {
    return currentHash === "#tomorrow" ? agendaData.todayTasks?.length || 0 : 0;
}

/**
 * Gets the total tasks for the agenda, considering the current hash.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @param {string} currentHash - The agenda page being displayed.
 * @returns The total number of tasks.
 */
export function getAgendaTaskCount(agendaData: AgendaData, currentHash: string): number {
    const baseTotal = (agendaData.tasks?.length || 0) + (agendaData.tasksWithNoTime?.length || 0);
    const additionalTasks = getTaskCountForHash(agendaData, currentHash);
    return baseTotal + additionalTasks;
}
