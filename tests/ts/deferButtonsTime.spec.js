import { describe, it, expect } from "vitest";
import { buttonConfig } from "../../src/html/defer/deferButtonsTime";

describe("buttonConfig", () => {
    it("should have a tomorrow button with correct properties", () => {
        expect(buttonConfig).toHaveProperty("tomorrow");
        expect(buttonConfig.tomorrow).toMatchObject({
            text: "tomorrow",
            ms: 0,
            styling: "basis-full",
            stylingButton: "h-6 bg-blue-900",
        });
    });

    it("should have a minutes array with correct values", () => {
        expect(buttonConfig).toHaveProperty("minutes");
        expect(Array.isArray(buttonConfig.minutes)).toBe(true);
        expect(buttonConfig.minutes).toEqual([
            { value: 1, height: "h-5" },
            { value: 3, height: "h-5" },
            { value: 10, height: "h-6" },
            { value: 15, height: "h-6" },
            { value: 30, height: "h-7" },
            { value: 45, height: "h-7" },
        ]);
    });

    it("should have an hours array with correct structure and values", () => {
        expect(buttonConfig).toHaveProperty("hours");
        expect(Array.isArray(buttonConfig.hours)).toBe(true);
        const hours = buttonConfig.hours;

        expect(hours.length).toBe(10);

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

        for (let i = 2; i < hours.length; i++) {
            expect(hours[i]).toHaveProperty("value");
            expect(hours[i]).toHaveProperty("height", "h-7");
            expect(hours[i]).toHaveProperty("styling", "basis-[22.75%]");
            expect(hours[i].text === undefined || typeof hours[i].text === "string").toBe(true);
        }

        const expectedValues = [1, 1.5, 2, 3, 4, 6, 8, 12, 18, 24];
        expect(hours.map((h) => h.value)).toEqual(expectedValues);
    });
});
