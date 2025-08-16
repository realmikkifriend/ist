import { get } from "svelte/store";
import { DateTime } from "luxon";
import { todoistData } from "../stores/stores";
import {
    sortAgendaTasks,
    getTargetDate,
    getSortedTasksForDate,
    getFilteredTasksWithNoTime,
    getTodayTasksForAgenda,
} from "../utils/agendaUtils";
import { getTasksInTimeRange } from "../utils/filterUtils";
import type { AgendaData } from "../types/agenda";

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
 * Returns the current agenda title based on the window hash.
 * @returns Agenda title to display.
 */
export const getTitle = (): string => {
    return window.location.hash.replace("#", "").replace(/^./, (c) => c.toUpperCase());
};

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
            ? sortAgendaTasks(
                  getTasksInTimeRange(currentData.tasks, now.startOf("day"), now.endOf("day")),
              )
            : { tasksWithNoTime: [], tasks: [] };

    const tasksWithNoTime = getFilteredTasksWithNoTime(
        sortedTasks.tasksWithNoTime,
        currentData.contexts,
    );
    const tasks = sortedTasks.tasks;
    const todayTasks = getTodayTasksForAgenda(tasksForTomorrow);

    const newAgendaData: AgendaData = {
        tasks,
        tasksForDate: targetDate
            ? getTasksInTimeRange(
                  currentData.tasks,
                  targetDate.startOf("day"),
                  targetDate.endOf("day"),
              )
            : [],
        tasksWithNoTime,
        todayTasks,
    };

    return newAgendaData;
};
