import { DateTime } from "luxon";
import { createDateWithTime } from "../../js/time";
import createButtons from "./deferButtons.ts";

function setupTomorrowButton(buttons, task) {
    const now = DateTime.now();
    const tomorrowDate = now.plus({ days: 1 });
    const result = createDateWithTime(task.due.string, tomorrowDate);

    if (result.newDate === null) {
        buttons[0].text = "";
        buttons[0].ms = 0;
    } else {
        const tomorrowInMS = result.newDate.diff(now).milliseconds;
        buttons[0].text = `tomorrow ${result.extractedTime}`;
        buttons[0].ms = tomorrowInMS;
    }
}

function getSoonTasks(tasks) {
    return tasks.filter((task) => {
        const dueDateTime = DateTime.fromISO(task.due.date);
        return (
            dueDateTime.isValid &&
            task.due.date.includes("T") &&
            dueDateTime.diffNow("hours").hours <= 25
        );
    });
}

function getTasksInTimeRange(tasks, currentTime, nextTime) {
    return tasks.filter((task) => {
        const dueDateTime = DateTime.fromISO(task.due.date);
        const isAfterCurrent = dueDateTime >= currentTime;
        const isBeforeNext = nextTime ? dueDateTime < nextTime : true;
        return isAfterCurrent && isBeforeNext;
    });
}

function updateButtonWithTasks(button, matchedTasks) {
    button.count = matchedTasks.length > 0 ? matchedTasks.length : "";
    button.priority =
        matchedTasks.length > 0 ? Math.max(...matchedTasks.map((task) => task.priority)) : "";
}

function formatButtonTime(futureTime, now) {
    const isTomorrow = now.startOf("day").toMillis() !== futureTime.startOf("day").toMillis();
    const timeFormat = futureTime.toFormat("h:mm a");
    return isTomorrow ? `*${timeFormat}` : timeFormat;
}

export function updateMilliseconds(task, tasks) {
    const buttons = createButtons();
    const now = DateTime.now();

    setupTomorrowButton(buttons, task);

    const soonTasks = getSoonTasks(tasks);

    buttons.slice(1).reduce((remainingTasks, button, index) => {
        const i = index + 1;
        const futureTime = now.plus({ milliseconds: button.ms });
        const nextFutureTime =
            i + 1 < buttons.length ? now.plus({ milliseconds: buttons[i + 1].ms }) : null;

        button.time = formatButtonTime(futureTime, now);

        const currentTime = i === 1 ? now : futureTime;
        const matchedTasks = getTasksInTimeRange(remainingTasks, currentTime, nextFutureTime);

        updateButtonWithTasks(button, matchedTasks);

        return remainingTasks.filter((task) => !matchedTasks.includes(task));
    }, soonTasks);

    return buttons;
}
