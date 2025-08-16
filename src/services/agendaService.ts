import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistData, firstDueTask } from "../stores/stores";
import { getGradientColor } from "../utils/styleUtils";
import {
    getTasksForDate,
    sortAgendaTasks,
    getTargetDate,
    getSortedTasksForDate,
    getFilteredTasksWithNoTime,
    getTodayTasksForAgenda,
    getAgendaTaskCount,
} from "../utils/agendaUtils";
import type { Task } from "../types/todoist";
import type { AgendaData } from "../types/agenda";

/**
 * Mark tasks with firstDue and closeTiming properties.
 * @param {Task[]} tasks - The tasks to mark.
 * @returns {(Task & { firstDue?: boolean; closeTiming?: boolean })[]} Marked tasks.
 */
export function markTasks(tasks: Task[]): (Task & { firstDue?: boolean; closeTiming?: boolean })[] {
    const firstDueTaskID = get(firstDueTask)?.id || null;

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

/**
 * Open the agenda drawer for a specific agenda type.
 * @param {string} agendaType - The agenda type to open.
 * @returns {void}
 */
export function openAgenda(agendaType: string = "today"): void {
    window.location.hash = agendaType;
}

/**
 * Cycles through agenda views.
 */
export const toggleAgendaHash = (): void => {
    const currentHash = window.location.hash;
    if (currentHash === "#today") {
        window.location.hash = "#tomorrow";
    } else if (currentHash === "#tomorrow") {
        window.location.hash = "";
    } else {
        window.location.hash = "#today";
    }
};

/**
 * Determines which hours should be displayed in the agenda.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @param {DateTime} now - Current date-time object.
 * @param {number[]} hourSlots - List of hours to check.
 * @returns Object of hours to display.
 */
export function getDisplayHours(
    agendaData: AgendaData,
    now: DateTime,
    hourSlots: number[],
): Record<number, boolean> {
    if (getTitle() === "Today") {
        const result: Record<number, boolean> = {};
        hourSlots.forEach((hour) => {
            const hourTasks = agendaData.tasks.filter(
                (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
            );
            result[hour] = hour >= now.hour || hourTasks.length > 0;
        });
        return result;
    } else {
        const result: Record<number, boolean> = {};
        hourSlots.forEach((hour) => (result[hour] = true));
        return result;
    }
}

/**
 * Returns the current agenda title based on the window hash.
 * @returns Agenda title to display.
 */
export const getTitle = (): string => {
    return window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
};

/**
 * Computes the header gradient color based on the number of tasks and the current hash.
 * @param {AgendaData} agendaData - Information on tasks for calculations.
 * @returns Tailwind classes of header gradient.
 */
export function computeHeaderGradientColor(agendaData: AgendaData): string {
    const currentHash = window.location.hash;
    const totalTasks = getAgendaTaskCount(agendaData, currentHash);
    return getGradientColor(totalTasks, currentHash ?? "") ?? "";
}

/**
 * Updates the agenda page data based on the current hash and todoist data.
 * @returns {AgendaData} Data to be displayed in agenda component.
 */
export const updateAgenda = (): AgendaData => {
    const currentData = get(todoistData);
    const now = DateTime.now();

    const targetDate = getTargetDate(now);
    const sortedTasks = getSortedTasksForDate(targetDate, currentData);

    const tasksForTomorrow =
        window.location.hash === "#tomorrow"
            ? sortAgendaTasks(getTasksForDate(now, currentData))
            : { tasksWithNoTime: [], tasks: [] };

    const tasksWithNoTime = getFilteredTasksWithNoTime(
        sortedTasks.tasksWithNoTime,
        currentData.contexts,
    );
    const tasks = sortedTasks.tasks;
    const todayTasks = getTodayTasksForAgenda(tasksForTomorrow);

    const newAgendaData: AgendaData = {
        tasks,
        tasksForDate: targetDate ? getTasksForDate(targetDate, currentData) : [],
        tasksWithNoTime,
        todayTasks,
    };

    return newAgendaData;
};
