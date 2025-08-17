import { DateTime } from "luxon";
import { roundFutureTime, createDateWithTime } from "./timeUtils";
import { buttonConfig, handleSameDayButton, handleNextDayButton } from "./deferTimeConfigs";
import type { Task } from "../types/todoist";
import type { ButtonConfig, DateButtonConfig, TimeButtonContext } from "../types/defer";

/**
 * Processes a button to calculate its ms and styling based on its position and time.
 * @param {ButtonConfig} button - The button to process.
 * @param {TimeButtonContext} context - Object containing futureTime, now, nextMorning, index, and processedButtons.
 * @returns The processed button.
 */
function processButton(button: ButtonConfig, context: TimeButtonContext): ButtonConfig {
    const futureTime = new Date(context.now.getTime() + (button.ms ?? 0));
    const roundedFutureTime = roundFutureTime(futureTime, context.index);

    const newContext: TimeButtonContext = {
        ...context,
        futureTime: roundedFutureTime,
    };

    if (roundedFutureTime.getDate() !== context.now.getDate()) {
        return handleNextDayButton(button, newContext, roundedFutureTime);
    }

    return handleSameDayButton(button, roundedFutureTime, context.now);
}

/**
 * Processes hour buttons to determine their display text and millisecond values.
 * @param {Date} now - The current date and time.
 * @returns An array of processed hour buttons.
 */
const processHourButtons = (now: Date): ButtonConfig[] => {
    return buttonConfig.hours
        .reduce(
            (acc, item) => {
                const baseMs = (item.value ?? 0) * 60 * 60 * 1000;
                const futureTimeCandidate = new Date(now.getTime() + baseMs);
                const isNextDayAdjustmentNeeded = futureTimeCandidate.getDate() !== now.getDate();
                const nextDayHourButtonCount = acc.filter(
                    (btn) =>
                        (btn as ButtonConfig & { isAdjustedForNextDay?: boolean })
                            .isAdjustedForNextDay,
                ).length;

                const nextDayTargetDateTime = DateTime.fromJSDate(now)
                    .plus({ days: 1 })
                    .set({ hour: 6, minute: 0, second: 0, millisecond: 0 })
                    .plus({ hours: nextDayHourButtonCount });

                const actualMs = isNextDayAdjustmentNeeded
                    ? nextDayTargetDateTime.diff(DateTime.fromJSDate(now)).milliseconds
                    : baseMs;

                const displayText = isNextDayAdjustmentNeeded
                    ? nextDayTargetDateTime.toFormat("h a")
                    : item.text || `${item.value} hrs`;

                acc.push({
                    text: displayText,
                    ms: actualMs,
                    styling: item.styling || "basis-[22.75%]",
                    stylingButton: item.height ?? "",
                    value: item.value,
                    height: item.height,
                    isAdjustedForNextDay: isNextDayAdjustmentNeeded,
                });
                return acc;
            },
            [] as (ButtonConfig & { isAdjustedForNextDay?: boolean })[],
        )
        .map(({ text, ms, styling, stylingButton, value, height }) => ({
            text,
            ms,
            styling,
            stylingButton,
            value,
            height,
        }));
};

/**
 * Creates an array of minute buttons with their configurations.
 * @returns An array of minute buttons.
 */
const createMinuteButtons = (): ButtonConfig[] => {
    return buttonConfig.minutes.map(({ value, height }) => ({
        text: `${value} minute${value && value > 1 ? "s" : ""}`,
        ms: (value ?? 0) * 60 * 1000,
        styling: "basis-[48.5%]",
        stylingButton: height ?? "",
        value,
        height,
    }));
};

/**
 * Creates an array of processed defer buttons with calculated times and styling.
 * @returns An array of processed buttons.
 */
export const createButtons = (): ButtonConfig[] => {
    const now = new Date();
    const nextMorning = new Date(now);
    nextMorning.setDate(now.getDate() + 1);
    nextMorning.setHours(6, 0, 0, 0);

    const buttons: ButtonConfig[] = [
        buttonConfig.tomorrow,
        ...createMinuteButtons(),
        ...processHourButtons(now),
    ];

    return buttons.map((button, index, array) => {
        const context: TimeButtonContext = {
            futureTime: new Date(),
            now,
            nextMorning,
            index,
            processedButtons: array.slice(0, index),
        };
        return processButton(button, context);
    });
};

/**
 * Sets up the "tomorrow" button with the correct text and milliseconds.
 * @param {DateButtonConfig[]} buttons - Array of button configs.
 * @param {Task} task - The task to defer.
 */
export function setupTomorrowButton(buttons: DateButtonConfig[], task: Task): void {
    const now = DateTime.now();
    const tomorrowDate = now.plus({ days: 1 });
    const result = createDateWithTime(task.due?.string ?? "", tomorrowDate);

    if (result.newDate === null) {
        const tomorrowSixAM = tomorrowDate.set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
        const tomorrowInMS = tomorrowSixAM.diff(now).milliseconds;

        buttons[0].text = `tomorrow 6 AM`;
        buttons[0].ms = tomorrowInMS;
    } else {
        const tomorrowInMS = result.newDate.diff(now).milliseconds;
        buttons[0].text = `tomorrow ${result.extractedTime}`;
        buttons[0].ms = tomorrowInMS;
    }
}

/**
 * Formats the button time for display.
 * @param {DateTime} futureTime - The future time for the button.
 * @param {DateTime} now - The current time.
 * @returns {string} - Formatted time string.
 */
export function formatButtonTime(futureTime: DateTime, now: DateTime): string {
    const isTomorrow = now.startOf("day").toMillis() !== futureTime.startOf("day").toMillis();
    const timeFormat = futureTime.toFormat("h:mm a");
    return isTomorrow ? `*${timeFormat}` : timeFormat;
}
