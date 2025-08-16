import { DateTime } from "luxon";
import type { Task, TodoistData, Context } from "../types/todoist";
import { filterAndSortTasks } from "../utils/filterUtils";
import { compareByPriority } from "../utils/comparisonUtils";

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

const getPositionForFirstTask = (taskDateTime: DateTime): number => {
    const minutes = taskDateTime.minute;
    return (minutes > 45 ? 46 : minutes) * 0.1;
};

const getPositionForSubsequentTask = (taskDateTime: DateTime, previousTaskDue: Task): number => {
    const timeDifference = taskDateTime.diff(
        DateTime.fromISO(previousTaskDue.due!.date),
        "minutes",
    ).minutes;

    if (taskDateTime.minute > 45 && timeDifference < 20) {
        return 0;
    }

    return Math.pow(timeDifference + 1, 2) * 0.0009;
};

/**
 * Calculate the position of a task in the agenda.
 * @param {Task & { closeTiming?: boolean }} task - The current task.
 * @param {Task | undefined} previousTaskDue - The previous task, if any.
 * @returns {number} The calculated position.
 */
export const calculateTaskPosition = (
    task: Task & { closeTiming?: boolean },
    previousTaskDue?: Task,
): number => {
    if (task.closeTiming) {
        return 0;
    }

    const taskDateTime = DateTime.fromISO(task.due?.date ?? "");

    if (!previousTaskDue) {
        return getPositionForFirstTask(taskDateTime);
    }

    return getPositionForSubsequentTask(taskDateTime, previousTaskDue);
};

/**
 * Calculate the style class for a task in the agenda.
 * @param {number} index - The index of the task to be styled.
 * @param {(Task & { closeTiming?: boolean })[]} tasks - The list of tasks.
 * @returns {string} The style class.
 */
export const calculateTaskStyle = (
    index: number,
    tasks: (Task & { closeTiming?: boolean })[],
): string => {
    const count = tasks
        .slice(0, index + 1)
        .reverse()
        .reduce((acc, task) => (task.closeTiming ? acc + 1 : acc), 0);

    const isIndented = count % 2 !== 0;

    const marginClass = isIndented ? "ml-[40%]" : "ml-0";
    const zIndexClass = isIndented ? "z-30" : "z-10";

    return `${marginClass} ${zIndexClass}`;
};
