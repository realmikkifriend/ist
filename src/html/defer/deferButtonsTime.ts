import type { TimeButtonConfig, ButtonConfig } from "../../../types/defer";

/**
 * Button configuration for defer buttons (time-based).
 */
export const buttonConfig: ButtonConfig = {
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
