import { DateTime } from "luxon";
import { roundFutureTime, createDateWithTime } from "./timeUtils";
import { buttonConfig, handleSameDayButton, handleNextDayButton } from "./deferTimeConfigs";
import type { Task } from "../types/todoist";
import type { TimeButtonConfig, DateButtonConfig, TimeButtonContext } from "../types/defer";

/**
 * Processes a button to calculate its ms and styling based on its position and time.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {TimeButtonContext} context - Object containing futureTime, now, nextMorning, index, and processedButtons.
 * @returns The processed button.
 */
function processButton(button: TimeButtonConfig, context: TimeButtonContext): TimeButtonConfig {
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
 * Creates an array of processed defer buttons with calculated times and styling.
 * @returns An array of processed buttons.
 */
export const createButtons = (): TimeButtonConfig[] => {
    const buttons: TimeButtonConfig[] = [];

    const now = new Date();
    const nextMorning = new Date(now);
    nextMorning.setDate(now.getDate() + 1);
    nextMorning.setHours(6, 0, 0, 0);

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

    const processedHours = buttonConfig.hours
        .reduce(
            (acc, item) => {
                const baseMs = (item.value ?? 0) * 60 * 60 * 1000;
                const futureTimeCandidate = new Date(now.getTime() + baseMs);

                const isNextDayAdjustmentNeeded = futureTimeCandidate.getDate() !== now.getDate();

                const nextDayHourButtonCount = acc.filter(
                    (btn) =>
                        (btn as TimeButtonConfig & { isAdjustedForNextDay?: boolean })
                            .isAdjustedForNextDay,
                ).length;

                const actualMs = isNextDayAdjustmentNeeded
                    ? (() => {
                          const targetHour = 6 + nextDayHourButtonCount;
                          const targetDate = new Date(now);
                          targetDate.setDate(now.getDate() + 1);
                          targetDate.setHours(targetHour, 0, 0, 0);
                          return targetDate.getTime() - now.getTime();
                      })()
                    : baseMs;

                const displayText = isNextDayAdjustmentNeeded
                    ? `${6 + nextDayHourButtonCount} AM`
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
            [] as (TimeButtonConfig & { isAdjustedForNextDay?: boolean })[],
        )
        .map((button) => {
            const { ...rest } = button;
            return rest;
        });

    buttons.push(...processedHours);

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
