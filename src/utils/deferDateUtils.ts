import { DateTime } from "luxon";
import { getPriorityClasses } from "../utils/styleUtils";
import type { Task, Priority } from "../types/todoist";
import type { CalendarContext } from "../types/defer";

/**
 * Returns the start and end DateTime for a given month/year string.
 * @param {string} monthYear - Month and year in "MMMM yyyy" format.
 * @param {DateTime} now - The current DateTime.
 * @returns {{ start: DateTime, end: DateTime }} - Paired start and end times.
 */
export function getCalendarDateRange(
    monthYear: string,
    now: DateTime,
): { start: DateTime; end: DateTime } {
    const startOfMonth = DateTime.fromFormat(monthYear, "MMMM yyyy").startOf("month");
    const start =
        monthYear === now.toFormat("MMMM yyyy")
            ? now.plus({ days: 1 }).startOf("day")
            : startOfMonth;
    const end = startOfMonth.endOf("month");
    return { start, end };
}

/**
 * Filters tasks for those due within the given date range and context.
 * @param {Task[]} tasks - Array of tasks.
 * @param {object} dateRange - Start and end DateTimes.
 * @param {DateTime} dateRange.start - Start of the date range to retrieve tasks for.
 * @param {DateTime} dateRange.end - End of the date range to retrieve tasks for.
 * @param {CalendarContext} context - Object containing timezone and context ID.
 * @returns {Task[]} - An array of tasks with the given parameters.
 */
export function getTasksForMonth(
    tasks: Task[],
    dateRange: { start: DateTime; end: DateTime },
    context: CalendarContext,
): Task[] {
    return tasks.filter((task) => {
        if (!task.due) return false;
        const dueDate = DateTime.fromISO(task.due.date).setZone(context.tz);
        return (
            dueDate >= dateRange.start &&
            dueDate <= dateRange.end &&
            task.contextId === context.contextId
        );
    });
}

/**
 * Determines if a calendar cell should be highlighted as "tomorrow".
 * @param {number} cellDate - The day number of the cell.
 * @param {string} monthYear - Month and year in "MMMM yyyy" format.
 * @param {DateTime} now - The current DateTime.
 * @returns {boolean} - Whether the given calendar cell is tomorrow.
 */
export function shouldHighlightTomorrow(
    cellDate: number,
    monthYear: string,
    now: DateTime,
): boolean {
    const tomorrowDate = DateTime.now().plus({ days: 1 }).day;
    const isTomorrow = cellDate === tomorrowDate;
    const currentMonthDisplayed = monthYear === now.toFormat("MMMM yyyy");
    const nextMonthDisplayed = monthYear === now.plus({ months: 1 }).toFormat("MMMM yyyy");

    return isTomorrow && (currentMonthDisplayed || (tomorrowDate === 1 && nextMonthDisplayed));
}

/**
 * Creates a DOM element containing dots representing up to 3 tasks, with a "+" if more.
 * @param {Task[]} tasks - Array of tasks for the date.
 * @returns {HTMLDivElement} - A DOM element of dots.
 */
export function createTaskDots(tasks: Task[]): HTMLDivElement {
    const dotContainer = document.createElement("div");
    dotContainer.className = "dot-container flex space-x-0.5 justify-center items-center h-1 -mt-2";

    const visibleTasks = tasks.slice(0, 3);
    const elements = visibleTasks.map((task) => {
        const div = document.createElement("div");
        div.className = `w-1 h-1 rounded-full ${getPriorityClasses(task.priority as Priority)}`;
        return div;
    });

    if (tasks.length > 3) {
        const plusDiv = document.createElement("div");
        plusDiv.textContent = "+";
        plusDiv.className = `text-[0.65rem] text-secondary h-[1.1rem] w-1 ml-0`;
        elements.push(plusDiv);
    }

    elements.forEach((element) => dotContainer.appendChild(element));
    return dotContainer;
}

/**
 * Processes a calendar cell, updating its highlight and task dots.
 * @param {HTMLTableCellElement} cell - The calendar cell element.
 * @param {number} cellDate - The day number for the cell.
 * @param {CalendarContext} context - Object containing monthYear, now, soonTasks, and tz.
 */
export function processCalendarCell(
    cell: HTMLTableCellElement,
    cellDate: number,
    context: CalendarContext,
): void {
    cell.querySelector(".dot-container")?.remove();
    cell.classList.remove("sdt-tomorrow");

    if (cell.querySelector("button[disabled]")) return;

    const grayedOut = cell.querySelector("button.not-current");
    if (!grayedOut && shouldHighlightTomorrow(cellDate, context.monthYear, context.now)) {
        cell.classList.add("sdt-tomorrow");
    }

    if (grayedOut) return;

    const tasksForDate = context.soonTasks
        .filter(({ due }) => due && DateTime.fromISO(due.date).setZone(context.tz).day === cellDate)
        .sort((a, b) => b.priority - a.priority);

    if (tasksForDate.length > 0) {
        const dotContainer = createTaskDots(tasksForDate);
        cell.appendChild(dotContainer);
    }
}
