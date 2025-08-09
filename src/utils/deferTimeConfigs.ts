import type { DeferButtonConfig, TimeButtonConfig, TimeButtonContext } from "../types/defer";

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
 * Handles the processing for a button that crosses into the next day.
 * @param {TimeButtonConfig} button - The button to process.
 * @param {TimeButtonContext} context - Object containing futureTime, now, nextMorning, index, and processedButtons.
 * @param {Date} adjustedFutureTime - Time to add to button.
 * @returns The processed button configuration.
 */
export function handleNextDayButton(
    button: TimeButtonConfig,
    context: TimeButtonContext,
    adjustedFutureTime: Date,
): TimeButtonConfig {
    return {
        ...button,
        ms: adjustedFutureTime.getTime() - context.now.getTime(),
        text: button.text ?? "",
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
export function handleSameDayButton(
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
 * Returns the symbol for the given number, for keyboard shortcuts.
 * @param {number} num - The given number.
 * @returns The symbol corresponding to the given number.
 */
export const getShiftedSymbol = (num: number): string => {
    const symbols: { [key: number]: string } = {
        0: ")",
        1: "!",
        2: "@",
        3: "#",
        4: "$",
        5: "%",
        6: "^",
        7: "&",
        8: "*",
        9: "(",
    };
    return symbols[num] || String(num);
};
