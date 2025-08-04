import { DateTime } from "luxon";
import { roundFutureTime, createDateWithTime } from "./timeUtils";
import { buttonConfig, handleSameDayButton, handleNextDayButton } from "./deferTimeConfigs";
import type { Task } from "../types/todoist";
import type { TimeButtonConfig, DateButtonConfig, TimeButtonContext } from "../types/defer";

/**
 * Calculates the adjusted time for a button that crosses into the next day.
 * @param {Date} futureTime - The original future time for the button.
 * @param {TimeButtonContext} context - Object containing now, nextMorning, index, and processedButtons.
 * @returns The adjusted Date object.
 */
export function calculateAdjustedTime(futureTime: Date, context: TimeButtonContext): Date {
    const adjustedTime = new Date(futureTime);

    const lastCrossedButton = context.processedButtons
        .slice(0, context.index)
        .reverse()
        .find(
            (btn) =>
                btn &&
                btn.ms !== undefined &&
                new Date(context.now.getTime() + btn.ms).getDate() !== context.now.getDate(),
        );

    if (context.index > 0 && lastCrossedButton && lastCrossedButton.ms !== undefined) {
        const hoursToAdd = context.processedButtons
            .slice(0, context.index)
            .filter(
                (btn) =>
                    btn &&
                    btn.ms !== undefined &&
                    new Date(context.now.getTime() + btn.ms).getDate() !== context.now.getDate(),
            ).length;

        const lastCrossedTime = new Date(context.now.getTime() + lastCrossedButton.ms);
        adjustedTime.setTime(lastCrossedTime.getTime() + hoursToAdd * 60 * 60 * 1000);
    }

    if (adjustedTime < context.nextMorning) {
        const hoursUntilMorning = Math.ceil(
            (context.nextMorning.getTime() - adjustedTime.getTime()) / (1000 * 60 * 60),
        );
        adjustedTime.setHours(adjustedTime.getHours() + hoursUntilMorning);
    }

    return roundFutureTime(adjustedTime, context.index);
}

/**
 * Processes a button to calculate its ms and styling based on its position and time.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {TimeButtonContext} context - Object containing futureTime, now, nextMorning, index, and processedButtons.
 * @returns The processed button.
 */
function processButton(button: TimeButtonConfig, context: TimeButtonContext): TimeButtonConfig {
    const futureTime = new Date(context.now.getTime() + (button.ms ?? 0));
    const roundedFutureTime = roundFutureTime(futureTime, context.index);

    const adjustedFutureTime = calculateAdjustedTime(roundedFutureTime, context);

    const newContext: TimeButtonContext = {
        ...context,
        futureTime: roundedFutureTime,
    };

    if (roundedFutureTime.getDate() !== context.now.getDate()) {
        return handleNextDayButton(button, newContext, adjustedFutureTime);
    }

    return handleSameDayButton(button, roundedFutureTime, context.now);
}

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
        buttons[0].text = "";
        buttons[0].ms = 0;
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
