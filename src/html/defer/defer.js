import { DateTime } from "luxon";
import { getPriorityClasses } from "../../js/classes";
import { createDateWithTime } from "../../js/time";
import createButtons from "./deferButtons";

export function updateMilliseconds(task, tasks) {
    const buttons = createButtons();

    const tomorrowDate = DateTime.now().plus({ days: 1 }),
        result = createDateWithTime(task.due.string, tomorrowDate),
        now = DateTime.now();

    if (result.newDate === null) {
        buttons[0].text = "";
        buttons[0].ms = 0;
    } else {
        const tomorrow = result.newDate,
            extractedTime = result.extractedTime,
            tomorrowInMS = tomorrow.diff(now).milliseconds;

        buttons[0].text = `tomorrow ${extractedTime}`;
        buttons[0].ms = tomorrowInMS;
    }

    const initialSoonTasks = tasks.filter((task) => {
        const dueDateTime = DateTime.fromISO(task.due.date);
        return (
            dueDateTime.isValid &&
            task.due.date.includes("T") &&
            dueDateTime.diffNow("hours").hours <= 25
        );
    });

    buttons.slice(1).reduce(
        (acc, button, index) => {
            const i = index + 1;
            const futureTime = now.plus({ milliseconds: button.ms });
            const nextFutureTime =
                i + 1 < buttons.length ? now.plus({ milliseconds: buttons[i + 1].ms }) : null;
            const isTomorrow =
                now.startOf("day").toMillis() !== futureTime.startOf("day").toMillis();
            const timeFormat = futureTime.toFormat("h:mm a");

            buttons[i].time = isTomorrow ? `<i>${timeFormat}</i>` : timeFormat;

            const { matchedTasks, remainingTasks } = acc.remainingTasks.reduce(
                (taskAcc, task) => {
                    const dueDateTime = DateTime.fromISO(task.due.date);
                    const isWithinFutureTime = nextFutureTime ? dueDateTime < nextFutureTime : true;
                    const isValidTime = i === 1 ? dueDateTime >= now : dueDateTime >= futureTime;

                    if (isWithinFutureTime && isValidTime) {
                        return {
                            matchedTasks: [...taskAcc.matchedTasks, task],
                            remainingTasks: taskAcc.remainingTasks,
                        };
                    }

                    return {
                        matchedTasks: taskAcc.matchedTasks,
                        remainingTasks: [...taskAcc.remainingTasks, task],
                    };
                },
                { matchedTasks: [], remainingTasks: [] },
            );

            Object.assign(buttons[i], { count: 0, priority: 0 });

            const count = matchedTasks.length > 0 ? matchedTasks.length : "";
            const priority =
                matchedTasks.length > 0
                    ? Math.max(...matchedTasks.map((task) => task.priority))
                    : "";

            buttons[i].count = count;
            buttons[i].priority = priority;

            return { remainingTasks };
        },
        { remainingTasks: initialSoonTasks },
    );

    return buttons;
}

export function updateCalendarCells(calendarElement, tz, tasks, taskToDefer) {
    if (!calendarElement) return;

    const monthYear = calendarElement.querySelector(".std-btn-header.sdt-toggle-btn").innerText;
    const now = DateTime.local().setZone(tz);
    const startOfMonth = DateTime.fromFormat(monthYear, "MMMM yyyy").startOf("month");
    const start =
        monthYear === now.toFormat("MMMM yyyy")
            ? now.plus({ days: 1 }).startOf("day")
            : startOfMonth;
    const end = startOfMonth.endOf("month");

    const soonTasks = tasks.filter((task) => {
        const dueDate = DateTime.fromISO(task.due.date).setZone(tz);
        return dueDate >= start && dueDate <= end && task.contextId === taskToDefer.contextId;
    });

    const calendarCells = calendarElement.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

    calendarCells.forEach((cell) => {
        cell.querySelector(".dot-container")?.remove();
        cell.classList.remove("sdt-tomorrow");

        if (cell.querySelector("button[disabled]")) return;

        const cellDate = parseInt(cell.textContent.trim());
        const tomorrowDate = DateTime.now().plus({ days: 1 }).day;
        const isTomorrow = cellDate === tomorrowDate;
        const grayedOut = cell.querySelector("button.not-current");
        const currentMonthDisplayed = monthYear === now.toFormat("MMMM yyyy");
        const nextMonthDisplayed = monthYear === now.plus({ months: 1 }).toFormat("MMMM yyyy");

        if (
            isTomorrow &&
            ((currentMonthDisplayed && !grayedOut) ||
                (tomorrowDate === 1 && (grayedOut || nextMonthDisplayed)))
        ) {
            cell.classList.add("sdt-tomorrow");
        }

        if (grayedOut) return;

        const tasksForCellDate = soonTasks.filter(
            ({ due }) => DateTime.fromISO(due.date).setZone(tz).day === cellDate,
        );
        tasksForCellDate.sort((a, b) => b.priority - a.priority);

        const dotContainer = document.createElement("div");
        dotContainer.className =
            "dot-container flex space-x-0.5 justify-center items-center h-1 mt-[-0.5rem]";

        const elements = tasksForCellDate.slice(0, 3).map((taskToDefer) => {
            const div = document.createElement("div");
            div.className = `w-1 h-1 rounded-full ${getPriorityClasses(taskToDefer.priority)}`;
            return div;
        });

        if (tasksForCellDate.length > 3) {
            const plusDiv = document.createElement("div");
            plusDiv.textContent = "+";
            plusDiv.className = `text-[0.65rem] text-secondary h-[1.1rem] w-1 ml-0`;
            elements.push(plusDiv);
        }

        elements.forEach((element) => dotContainer.appendChild(element));

        cell.appendChild(dotContainer);
    });
}
