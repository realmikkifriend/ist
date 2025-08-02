import { buttonConfig } from "./deferButtonsTime";
import type { TimeButtonConfig } from "../../types/defer";

/**
 * Calculates the adjusted time for a button that crosses into the next day.
 * @param {Date} futureTime - The original future time for the button.
 * @param {Date} nextMorning - The Date representing the next morning (6am).
 * @param {number} index - The index of the button in the array.
 * @param {(TimeButtonConfig | null)[]} processedButtons - The array of already processed buttons.
 * @returns The adjusted Date object.
 */
function calculateAdjustedTime(
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
 * Rounds the future time for a button based on its index.
 * @param {Date} futureTime - The future time to round.
 * @param {number} index - The index of the button.
 */
function roundFutureTime(futureTime: Date, index: number): void {
    if (index > 2) {
        const roundingFactor = index >= 3 && index <= 7 ? 5 : 15;
        const roundedMinutes =
            Math.round(futureTime.getMinutes() / roundingFactor) * roundingFactor;
        futureTime.setMinutes(roundedMinutes);
    }
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
const createButtons = (): TimeButtonConfig[] => {
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

export default createButtons;
