import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { AgendaData } from "../types/agenda";

/**
 * Mark tasks with firstDue and closeTiming properties.
 * @param {Task[]} tasks - The tasks to mark.
 * @param {Task | null} firstDueTask - The task displayed in the main screen.
 * @returns {(Task & { firstDue?: boolean; closeTiming?: boolean })[]} Marked tasks.
 */
export function markTasks(
    tasks: Task[],
    firstDueTask: Task | null,
): (Task & { firstDue?: boolean; closeTiming?: boolean })[] {
    const firstDueTaskID = firstDueTask?.id || null;

    return tasks.map((currentTask, index) => {
        const markedTask: Task & { firstDue?: boolean; closeTiming?: boolean } = {
            ...currentTask,
            firstDue: firstDueTaskID === currentTask.id,
            closeTiming: false,
        };

        if (index > 0) {
            const previousTaskDue = tasks[index - 1].due?.date;
            const currentTaskDue = currentTask.due?.date;

            if (previousTaskDue && currentTaskDue) {
                const differenceInMinutes = DateTime.fromISO(currentTaskDue).diff(
                    DateTime.fromISO(previousTaskDue),
                    "minutes",
                ).minutes;
                markedTask.closeTiming = differenceInMinutes <= 10;
            }
        }
        return markedTask;
    });
}

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
        const minutes = taskDateTime.minute;
        return (minutes > 45 ? 46 : minutes) * 0.1;
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

/**
 * Determines which hours should be displayed in the agenda.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @param {DateTime} now - Current date-time object.
 * @param {number[]} hourSlots - List of hours to check.
 * @param {string} title - The title of the agenda.
 * @returns Object of hours to display.
 */
export function getDisplayHours(
    agendaData: AgendaData,
    now: DateTime,
    hourSlots: number[],
    title: string,
): Record<number, boolean> {
    if (title === "Today") {
        const result: Record<number, boolean> = {};
        hourSlots.forEach((hour) => {
            const hourTasks = agendaData.tasks.filter(
                (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
            );
            result[hour] = hour >= now.hour || hourTasks.length > 0;
        });
        return result;
    }

    const result: Record<number, boolean> = {};
    hourSlots.forEach((hour) => (result[hour] = true));
    return result;
}
