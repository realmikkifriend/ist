import { DateTime } from "luxon";
import { getPriorityClasses } from "../../js/classes";

function getCalendarDateRange(monthYear, now) {
    const startOfMonth = DateTime.fromFormat(monthYear, "MMMM yyyy").startOf("month");
    const start =
        monthYear === now.toFormat("MMMM yyyy")
            ? now.plus({ days: 1 }).startOf("day")
            : startOfMonth;
    const end = startOfMonth.endOf("month");
    return { start, end };
}

function getTasksForMonth(tasks, start, end, tz, contextId) {
    return tasks.filter((task) => {
        const dueDate = DateTime.fromISO(task.due.date).setZone(tz);
        return dueDate >= start && dueDate <= end && task.contextId === contextId;
    });
}

function shouldHighlightTomorrow(cellDate, monthYear, now) {
    const tomorrowDate = DateTime.now().plus({ days: 1 }).day;
    const isTomorrow = cellDate === tomorrowDate;
    const currentMonthDisplayed = monthYear === now.toFormat("MMMM yyyy");
    const nextMonthDisplayed = monthYear === now.plus({ months: 1 }).toFormat("MMMM yyyy");

    return isTomorrow && (currentMonthDisplayed || (tomorrowDate === 1 && nextMonthDisplayed));
}

function createTaskDots(tasks) {
    const dotContainer = document.createElement("div");
    dotContainer.className =
        "dot-container flex space-x-0.5 justify-center items-center h-1 mt-[-0.5rem]";

    const visibleTasks = tasks.slice(0, 3);
    const elements = visibleTasks.map((task) => {
        const div = document.createElement("div");
        div.className = `w-1 h-1 rounded-full ${getPriorityClasses(task.priority)}`;
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

function processCalendarCell(cell, cellDate, monthYear, now, soonTasks, tz) {
    cell.querySelector(".dot-container")?.remove();
    cell.classList.remove("sdt-tomorrow");

    if (cell.querySelector("button[disabled]")) return;

    const grayedOut = cell.querySelector("button.not-current");
    if (!grayedOut && shouldHighlightTomorrow(cellDate, monthYear, now)) {
        cell.classList.add("sdt-tomorrow");
    }

    if (grayedOut) return;

    const tasksForDate = soonTasks
        .filter(({ due }) => DateTime.fromISO(due.date).setZone(tz).day === cellDate)
        .sort((a, b) => b.priority - a.priority);

    if (tasksForDate.length > 0) {
        const dotContainer = createTaskDots(tasksForDate);
        cell.appendChild(dotContainer);
    }
}

export function updateCalendarCells(calendarElement, tz, tasks, taskToDefer) {
    if (!calendarElement) return;

    const monthYear = calendarElement.querySelector(".std-btn-header.sdt-toggle-btn").innerText;
    const now = DateTime.local().setZone(tz);
    const { start, end } = getCalendarDateRange(monthYear, now);
    const soonTasks = getTasksForMonth(tasks, start, end, tz, taskToDefer.contextId);
    const calendarCells = calendarElement.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

    calendarCells.forEach((cell) => {
        const cellDate = parseInt(cell.textContent.trim());
        processCalendarCell(cell, cellDate, monthYear, now, soonTasks, tz);
    });
}
