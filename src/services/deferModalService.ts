import { DateTime } from "luxon";
import { createDateWithTime } from "../utils/timeUtils";
import { processButton } from "../utils/deferTimeUtils";
import { getSoonTasks } from "../utils/filterUtils";
import {
    getCalendarDateRange,
    getTasksForMonth,
    processCalendarCell,
} from "../utils/deferDateUtils";
import type { Task, Priority } from "../types/todoist";
import type { DateButtonConfig, TimeButtonConfig, DeferButtonConfig } from "../types/defer";

/**
 * Button configuration for defer buttons (time-based).
 */
export const buttonConfig: DeferButtonConfig = {
    tomorrow: {
        text: "tomorrow",
        ms: 0,
        styling: "basis-full",
        stylingButton: "h-6 bg-blue-900",
    },

    minutes: [
        { value: 1, height: "h-5" },
        { value: 3, height: "h-5" },
        { value: 10, height: "h-6" },
        { value: 15, height: "h-6" },
        { value: 30, height: "h-7" },
        { value: 45, height: "h-7" },
    ],

    hours: ((): TimeButtonConfig[] => {
        const baseStyling = "basis-[22.75%]";
        const largeStyling = "basis-[48.5%]";

        const hoursValues: Array<Partial<TimeButtonConfig> & { value: number }> = [
            { value: 1, text: "1 hour", styling: largeStyling },
            { value: 1.5, text: "90 minutes", styling: largeStyling },
            { value: 2 },
            { value: 3 },
            { value: 4 },
            { value: 6 },
            { value: 8 },
            { value: 12 },
            { value: 18 },
            { value: 24 },
        ];

        return hoursValues.map((item) => ({
            value: item.value,
            text: item.text || undefined,
            height: "h-7",
            styling: item.styling || baseStyling,
        }));
    })(),
};

/**
 * Creates an array of processed defer buttons with calculated times and styling.
 * @returns An array of processed buttons.
 */
export const createButtons = (): TimeButtonConfig[] => {
    const buttons: TimeButtonConfig[] = [];

    buttons.push(buttonConfig.tomorrow);

    buttonConfig.minutes.forEach(({ value, height }) => {
        buttons.push({
            text: `${value} minute${value && value > 1 ? "s" : ""}`,
            ms: (value ?? 0) * 60 * 1000,
            styling: "basis-[48.5%]",
            stylingButton: height ?? "",
            value,
            height,
        });
    });

    buttonConfig.hours.forEach(({ value, text, height, styling }) => {
        const displayText = text || `${value} hrs`;
        const buttonStyling = styling || "basis-[22.75%]";

        buttons.push({
            text: displayText,
            ms: (value ?? 0) * 60 * 60 * 1000,
            styling: buttonStyling,
            stylingButton: height ?? "",
            value,
            height,
        });
    });

    const now = new Date();
    const nextMorning = new Date(now);
    nextMorning.setDate(now.getDate() + 1);
    nextMorning.setHours(6, 0, 0, 0);

    return buttons.map((button, index, array) => {
        const processedButtons = array.slice(0, index).map((btn, i) =>
            i < index
                ? processButton(
                      btn,
                      i,
                      array
                          .slice(0, i)
                          .map((b, j) =>
                              j < i
                                  ? processButton(b, j, array.slice(0, j), now, nextMorning)
                                  : null,
                          ),
                      now,
                      nextMorning,
                  )
                : null,
        );
        return processButton(button, index, processedButtons, now, nextMorning);
    });
};

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

/**
 * Updates all calendar cells in the given calendar element with task dots and highlights.
 * @param {HTMLElement} calendarElement - The calendar DOM element.
 * @param {string} tz - Timezone string.
 * @param {Task[]} tasks - Array of all tasks.
 * @param {Task} taskToDefer - The task being deferred (for contextId).
 */
export function updateCalendarCells(
    calendarElement: HTMLElement,
    tz: string,
    tasks: Task[],
    taskToDefer: Task,
): void {
    if (!calendarElement) return;

    const header = calendarElement.querySelector(".std-btn-header.sdt-toggle-btn");
    if (!(header instanceof HTMLElement)) return;
    const monthYear = header.innerText;
    const now = DateTime.local().setZone(tz);
    const { start, end } = getCalendarDateRange(monthYear, now);
    const soonTasks = getTasksForMonth(tasks, start, end, tz, taskToDefer.contextId ?? "");
    const calendarCells = calendarElement.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

    calendarCells.forEach((cell) => {
        const cellText = cell.textContent?.trim() ?? "";
        const cellDate = parseInt(cellText);
        if (!isNaN(cellDate)) {
            processCalendarCell(
                cell as HTMLTableCellElement,
                cellDate,
                monthYear,
                now,
                soonTasks,
                tz,
            );
        }
    });
}
