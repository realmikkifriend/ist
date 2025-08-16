import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { AgendaData, GradientType } from "../types/agenda";
import { getAgendaTaskCount } from "./agendaUtils";

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
            } else {
                markedTask.closeTiming = false;
            }
        } else {
            markedTask.closeTiming = false;
        }
        return markedTask;
    });
}

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

function getTomorrowGradient(
    totalTasks: number,
    gradients: Record<GradientType, string>,
): string | null {
    const thresholds = [
        { limit: 21, color: gradients.red },
        { limit: 19, color: gradients.orange },
        { limit: 17, color: null },
        { limit: 15, color: gradients.darkGreen },
        { limit: 12, color: gradients.green },
    ];

    const found = thresholds.find(({ limit }) => totalTasks >= limit);
    return found ? found.color : gradients.blue;
}

function getTodayGradient(
    totalTasks: number,
    gradients: Record<GradientType, string>,
): string | null {
    const currentHour = new Date().getHours();
    const hourAdjustment = Math.max(0, currentHour - 8);
    const todayThreshold = 14 - hourAdjustment;
    const diff = totalTasks - todayThreshold;

    if (diff < -2) return gradients.blue;
    if (diff > 1) return gradients.red;

    const diffMap: Map<number, string | null> = new Map([
        [-2, gradients.green],
        [-1, gradients.darkGreen],
        [0, null],
        [1, gradients.orange],
    ]);

    return diffMap.get(diff) ?? "";
}

/**
 * Determines a gradient background class based on the total number of tasks and a hash string.
 * @param {number} totalTasks - The total number of tasks.
 * @param {string} hash - The hash string, e.g., "#today", "#tomorrow", or others.
 * @returns The gradient CSS class string, null, or an empty string depending on conditions.
 */
function getGradientColor(totalTasks: number, hash: string): string | null {
    if (totalTasks === 0) {
        return null;
    }

    const gradients: Record<GradientType, string> = {
        blue: "bg-linear-to-r from-blue-900 to-blue-700",
        green: "bg-linear-to-r from-green-900 to-green-700",
        darkGreen: "bg-linear-to-r from-emerald-900 to-emerald-700",
        orange: "bg-linear-to-r from-orange-800 to-orange-600",
        red: "bg-linear-to-r from-red-900 to-red-700",
    };

    const gradientStrategies: Record<string, () => string | null> = {
        "#tomorrow": () => getTomorrowGradient(totalTasks, gradients),
        "#today": () => getTodayGradient(totalTasks, gradients),
    };

    const strategy = gradientStrategies[hash];
    return strategy ? strategy() : "";
}

/**
 * Computes the header gradient color based on the number of tasks and the current hash.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @param {string} title - The title of the agenda.
 * @returns Tailwind classes of header gradient.
 */
export function computeHeaderGradientColor(agendaData: AgendaData, title: string): string {
    const currentHash = title ? `#${title.toLowerCase()}` : "";
    const totalTasks = getAgendaTaskCount(agendaData, currentHash);
    return getGradientColor(totalTasks, currentHash ?? "") ?? "";
}
