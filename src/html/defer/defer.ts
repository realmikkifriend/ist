import { DateTime } from "luxon";
import { createDateWithTime } from "../../js/time";
import createButtons from "./deferButtons";
import type { Task, Priority } from "../../../types/todoist";
import type { DateButtonConfig } from "../../../types/defer";

/**
 * Sets up the "tomorrow" button with the correct text and milliseconds.
 * @param {DateButtonConfig[]} buttons - Array of button configs.
 * @param {Task} task - The task to defer.
 */
function setupTomorrowButton(buttons: DateButtonConfig[], task: Task): void {
    const now = DateTime.now();
    const tomorrowDate = now.plus({ days: 1 });
    const result = createDateWithTime(task.due?.string ?? "", tomorrowDate);

    if (result.newDate === null) {
        buttons[0].text = "";
        buttons[0].ms = 0;
    } else {
        const tomorrowInMS = result.newDate.diff(now).milliseconds;
        buttons[0].text = `tomorrow ${result.extractedTime}`;
        buttons[0].ms = tomorrowInMS;
    }
}

/**
 * Filters tasks that are due soon (within 25 hours and have a time).
 * @param {Task[]} tasks - Array of tasks.
 * @returns {Task[]} - Filtered array of soon tasks.
 */
function getSoonTasks(tasks: Task[]): Task[] {
    return tasks.filter((task) => {
        if (!task.due || !task.due.date) return false;
        const dueDateTime = DateTime.fromISO(task.due.date);
        return (
            dueDateTime.isValid &&
            task.due.date.includes("T") &&
            dueDateTime.diffNow("hours").hours <= 25
        );
    });
}

/**
 * Filters tasks that are due within a specific time range.
 * @param {Task[]} tasks - Array of tasks.
 * @param {DateTime} currentTime - Start of the time range.
 * @param {DateTime | null} nextTime - End of the time range.
 * @returns {Task[]} - Filtered array of tasks in the time range.
 */
function getTasksInTimeRange(
    tasks: Task[],
    currentTime: DateTime,
    nextTime: DateTime | null,
): Task[] {
    return tasks.filter((task) => {
        if (!task.due || !task.due.date) return false;
        const dueDateTime = DateTime.fromISO(task.due.date);
        const isAfterCurrent = dueDateTime.toMillis() >= currentTime.toMillis();
        const isBeforeNext = nextTime ? dueDateTime.toMillis() < nextTime.toMillis() : true;
        return isAfterCurrent && isBeforeNext;
    });
}

/**
 * Updates a button with the count and highest priority of matched tasks.
 * @param {DateButtonConfig} button - The button config to update.
 * @param {Task[]} matchedTasks - Array of matched tasks.
 */
function updateButtonWithTasks(button: DateButtonConfig, matchedTasks: Task[]): void {
    button.count = matchedTasks.length > 0 ? matchedTasks.length : "";
    button.priority =
        matchedTasks.length > 0
            ? (Math.max(...matchedTasks.map((task) => task.priority ?? 1)) as Priority)
            : undefined;
}

/**
 * Formats the button time for display.
 * @param {DateTime} futureTime - The future time for the button.
 * @param {DateTime} now - The current time.
 * @returns {string} - Formatted time string.
 */
function formatButtonTime(futureTime: DateTime, now: DateTime): string {
    const isTomorrow = now.startOf("day").toMillis() !== futureTime.startOf("day").toMillis();
    const timeFormat = futureTime.toFormat("h:mm a");
    return isTomorrow ? `*${timeFormat}` : timeFormat;
}

/**
 * Updates the milliseconds and other properties for defer buttons based on tasks.
 * @param {Task} task - The current task.
 * @param {Task[]} tasks - Array of all tasks.
 * @returns {DateButtonConfig[]} - Array of updated button configs.
 */
export function updateMilliseconds(task: Task, tasks: Task[]): DateButtonConfig[] {
    const buttons: DateButtonConfig[] = createButtons();
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
