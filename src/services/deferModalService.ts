import { DateTime } from "luxon";
import { createButtons, setupTomorrowButton, formatButtonTime } from "../utils/deferTimeUtils";
import { getSoonTasks, getTasksInTimeRange } from "../utils/filterUtils";
import type { Task, Priority } from "../types/todoist";
import type { DateButtonConfig } from "../types/defer";

/**
 * Updates a button with the count and highest priority of matched tasks.
 * @param {DateButtonConfig} button - The button config to update.
 * @param {Task[]} matchedTasks - Array of matched tasks.
 */
function updateButtonWithTasks(button: DateButtonConfig, matchedTasks: Task[]): void {
    button.tasks = matchedTasks.sort((a, b) => (b.priority ?? 1) - (a.priority ?? 1));
    button.priority =
        matchedTasks.length > 0
            ? (Math.max(...matchedTasks.map((task) => task.priority ?? 1)) as Priority)
            : undefined;
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
