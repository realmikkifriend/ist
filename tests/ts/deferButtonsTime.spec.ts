import { describe, it, expect } from "vitest";
import { buttonConfig } from "../../src/html/defer/deferButtonsTime";
import type { DeferButtonConfig, TimeButtonConfig } from "../../types/defer";

describe("buttonConfig", () => {
    it("should match DeferButtonConfig type", () => {
        const config: DeferButtonConfig = buttonConfig;
        expect(config).toBeDefined();
    });

    it("should have a tomorrow button with correct properties", () => {
        expect(buttonConfig).toHaveProperty("tomorrow");
        const tomorrow: TimeButtonConfig = buttonConfig.tomorrow;
        expect(tomorrow).toMatchObject({
            text: "tomorrow",
            ms: 0,
            styling: "basis-full",
            stylingButton: "h-6 bg-blue-900",
        });
    });

    it("should have a minutes array with correct values and types", () => {
        expect(buttonConfig).toHaveProperty("minutes");
        expect(Array.isArray(buttonConfig.minutes)).toBe(true);
        buttonConfig.minutes.forEach((minute) => {
            expect(typeof minute.value).toBe("number");
            expect(typeof minute.height).toBe("string");
        });
        expect(buttonConfig.minutes).toEqual([
            { value: 1, height: "h-5" },
            { value: 3, height: "h-5" },
            { value: 10, height: "h-6" },
            { value: 15, height: "h-6" },
            { value: 30, height: "h-7" },
            { value: 45, height: "h-7" },
        ]);
    });

    it("should have an hours array with correct structure, values, and types", () => {
        expect(buttonConfig).toHaveProperty("hours");
        expect(Array.isArray(buttonConfig.hours)).toBe(true);
        const hours = buttonConfig.hours;

        expect(hours.length).toBe(10);

        hours.forEach((hour) => {
            expect(typeof hour.value).toBe("number");
            expect(typeof hour.height).toBe("string");
            expect(typeof hour.styling).toBe("string");
            if (hour.text !== undefined) {
                expect(typeof hour.text).toBe("string");
            }
        });

        expect(hours[0]).toMatchObject({
            value: 1,
            text: "1 hour",
            height: "h-7",
            styling: "basis-[48.5%]",
        });
        expect(hours[1]).toMatchObject({
            value: 1.5,
            text: "90 minutes",
            height: "h-7",
            styling: "basis-[48.5%]",
        });

        hours.slice(2).forEach((hour) => {
            expect(hour).toHaveProperty("value");
            expect(hour).toHaveProperty("height", "h-7");
            expect(hour).toHaveProperty("styling", "basis-[22.75%]");
            expect(hour.text === undefined || typeof hour.text === "string").toBe(true);
        });

        const expectedValues = [1, 1.5, 2, 3, 4, 6, 8, 12, 18, 24];
        expect(hours.map((h) => h.value)).toEqual(expectedValues);
    });
});
