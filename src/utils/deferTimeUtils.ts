import { DateTime } from "luxon";
import { roundFutureTime, createDateWithTime } from "./timeUtils";
import type { Task } from "../types/todoist";
import type { DeferButtonConfig, TimeButtonConfig, DateButtonConfig } from "../types/defer";

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
 * Calculates the adjusted time for a button that crosses into the next day.
 * @param {Date} futureTime - The original future time for the button.
 * @param {Date} nextMorning - The Date representing the next morning (6am).
 * @param {number} index - The index of the button in the array.
 * @param {(TimeButtonConfig | null)[]} processedButtons - The array of already processed buttons.
 * @returns The adjusted Date object.
 */
export function calculateAdjustedTime(
    futureTime: Date,
    nextMorning: Date,
    index: number,
    processedButtons: (TimeButtonConfig | null)[],
): Date {
    const now = new Date();
    const adjustedTime = new Date(futureTime);

    const lastCrossedButton = processedButtons
        .slice(0, index)
        .reverse()
        .find(
            (btn) =>
                btn &&
                btn.ms !== undefined &&
                new Date(now.getTime() + btn.ms).getDate() !== now.getDate(),
        );

    if (index > 0 && lastCrossedButton && lastCrossedButton.ms !== undefined) {
        const hoursToAdd = processedButtons
            .slice(0, index)
            .filter(
                (btn) =>
                    btn &&
                    btn.ms !== undefined &&
                    new Date(now.getTime() + btn.ms).getDate() !== now.getDate(),
            ).length;

        const lastCrossedTime = new Date(now.getTime() + lastCrossedButton.ms);
        adjustedTime.setTime(lastCrossedTime.getTime() + hoursToAdd * 60 * 60 * 1000);
    }

    if (adjustedTime < nextMorning) {
        const hoursUntilMorning = Math.ceil(
            (nextMorning.getTime() - adjustedTime.getTime()) / (1000 * 60 * 60),
        );
        adjustedTime.setHours(adjustedTime.getHours() + hoursUntilMorning);
    }

    return adjustedTime;
}

/**
 * Handles the processing for a button that crosses into the next day.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {Date} futureTime - The original future time.
 * @param {Date} now - The current Date.
 * @param {Date} nextMorning - The Date for the next morning.
 * @param {number} index - The button processing index.
 * @param {(TimeButtonConfig | null)[]} processedButtons - Previously processed buttons.
 * @returns The processed button configuration.
 */
function handleNextDayButton(
    button: TimeButtonConfig,
    futureTime: Date,
    now: Date,
    nextMorning: Date,
    index: number,
    processedButtons: (TimeButtonConfig | null)[],
): TimeButtonConfig {
    const adjustedFutureTime = calculateAdjustedTime(
        futureTime,
        nextMorning,
        index,
        processedButtons,
    );

    const hoursInFuture = Math.floor(
        (adjustedFutureTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    return {
        ...button,
        ms: adjustedFutureTime.getTime() - now.getTime(),
        text: `${hoursInFuture} hrs`,
        styling: button.styling ?? "",
        stylingButton: (button.stylingButton ?? "") + " bg-blue-900",
    };
}

/**
 * Handles the processing for a button that does not cross into the next day.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {Date} futureTime - The button deferral time.
 * @param {Date} now - The current date.
 * @returns The processed button configuration.
 */
function handleSameDayButton(
    button: TimeButtonConfig,
    futureTime: Date,
    now: Date,
): TimeButtonConfig {
    const stylingButton =
        (button.stylingButton ?? "") + (button.text !== "tomorrow" ? " bg-neutral" : "");
    return {
        ...button,
        ms: futureTime.getTime() - now.getTime(),
        text: button.text ?? "",
        styling: button.styling ?? "",
        stylingButton,
    };
}

/**
 * Processes a button to calculate its ms and styling based on its position and time.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {number} index - The index of the button in the array.
 * @param {(TimeButtonConfig | null)[]} processedButtons - The array of already processed buttons.
 * @param {Date} now - The current Date.
 * @param {Date} nextMorning - The Date representing the next morning (6am).
 * @returns The processed button.
 */
function processButton(
    button: TimeButtonConfig,
    index: number,
    processedButtons: (TimeButtonConfig | null)[],
    now: Date,
    nextMorning: Date,
): TimeButtonConfig {
    const futureTime = new Date(now.getTime() + (button.ms ?? 0));
    roundFutureTime(futureTime, index);

    if (futureTime.getDate() !== now.getDate()) {
        return handleNextDayButton(button, futureTime, now, nextMorning, index, processedButtons);
    }

    return handleSameDayButton(button, futureTime, now);
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
