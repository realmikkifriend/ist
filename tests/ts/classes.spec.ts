import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    getPriorityClasses,
    getPriorityBorder,
    colorClasses,
    borderClasses,
    getQuarterHourPosition,
    getGradientColor,
} from "../../src/js/classes";
import type { Priority, ColorName } from "../../types/todoist.js";
import type { QuarterHourPosition } from "../../types/agenda.js";

describe("getPriorityClasses", () => {
    it("returns correct classes for all valid priorities", () => {
        const expectedClasses = {
            1: "bg-priority-1 text-white",
            2: "bg-priority-2 text-white",
            3: "bg-priority-3 text-white",
            4: "bg-priority-4 text-white",
        };

        Object.entries(expectedClasses).forEach(([priority, expectedClass]) => {
            expect(getPriorityClasses(Number(priority) as Priority)).toBe(expectedClass);
        });
    });

    it("returns empty string for invalid priorities", () => {
        [0, 5, -1, null, undefined].forEach((invalidPriority: unknown) => {
            expect(getPriorityClasses(invalidPriority as Priority)).toBe("");
        });
    });
});

describe("getPriorityBorder", () => {
    it("returns correct border classes for all valid priorities", () => {
        const expectedBorders = {
            1: "border-b-priority-1",
            2: "border-b-priority-2",
            3: "border-b-priority-3",
            4: "border-b-priority-4",
        };

        Object.entries(expectedBorders).forEach(([priority, expectedBorder]) => {
            expect(getPriorityBorder(Number(priority) as Priority)).toBe(expectedBorder);
        });
    });

    it("returns empty string for invalid priorities", () => {
        [0, 5, -1, null, undefined].forEach((invalidPriority: unknown) => {
            expect(getPriorityBorder(invalidPriority as Priority)).toBe("");
        });
    });
});

describe("colorClasses", () => {
    it("contains all expected color mappings", () => {
        const expectedColors: Record<ColorName, string> = {
            berry_red: "bg-pink-600",
            red: "bg-red-500",
            orange: "bg-orange-500",
            yellow: "bg-yellow-500",
            olive_green: "bg-lime-700",
            lime_green: "bg-lime-500",
            green: "bg-green-600",
            mint_green: "bg-emerald-400",
            teal: "bg-teal-600",
            sky_blue: "bg-sky-400",
            light_blue: "bg-blue-300",
            blue: "bg-blue-500",
            grape: "bg-violet-500",
            violet: "bg-fuchsia-600",
            lavender: "bg-pink-300",
            magenta: "bg-pink-500",
            salmon: "bg-rose-400",
            charcoal: "bg-gray-600",
            grey: "bg-gray-400",
            taupe: "bg-red-100",
        };

        Object.entries(expectedColors).forEach(([colorName, expectedClass]) => {
            expect(colorClasses[colorName as ColorName]).toBe(expectedClass);
        });

        expect(Object.keys(colorClasses)).toHaveLength(20);
    });
});

describe("borderClasses", () => {
    it("contains all expected border color mappings", () => {
        const expectedBorders: Record<ColorName, string> = {
            berry_red: "border-pink-600",
            red: "border-red-500",
            orange: "border-orange-500",
            yellow: "border-yellow-500",
            olive_green: "border-lime-700",
            lime_green: "border-lime-500",
            green: "border-green-600",
            mint_green: "border-emerald-400",
            teal: "border-teal-600",
            sky_blue: "border-sky-400",
            light_blue: "border-blue-300",
            blue: "border-blue-500",
            grape: "border-violet-500",
            violet: "border-fuchsia-600",
            lavender: "border-pink-300",
            magenta: "border-pink-500",
            salmon: "border-rose-400",
            charcoal: "border-gray-600",
            grey: "border-gray-400",
            taupe: "border-red-100",
        };

        Object.entries(expectedBorders).forEach(([colorName, expectedClass]) => {
            expect(borderClasses[colorName as ColorName]).toBe(expectedClass);
        });

        expect(Object.keys(borderClasses)).toHaveLength(20);
    });

    it("has matching keys with colorClasses", () => {
        const colorKeys = Object.keys(colorClasses).sort();
        const borderKeys = Object.keys(borderClasses).sort();
        expect(borderKeys).toEqual(colorKeys);
    });
});

describe("getQuarterHourPosition", () => {
    it("returns correct positions for all valid quarter hours", () => {
        const expectedPositions = {
            0.25: "top-[25%]",
            0.5: "top-[50%]",
            0.75: "top-[75%]",
        };

        Object.entries(expectedPositions).forEach(([position, expectedClass]) => {
            expect(getQuarterHourPosition(Number(position) as QuarterHourPosition)).toBe(
                expectedClass,
            );
        });
    });

    it("returns empty string for invalid positions", () => {
        [0.1, 1.0, 0, -0.25, null, undefined].forEach((invalidPosition: unknown) => {
            expect(getQuarterHourPosition(invalidPosition as QuarterHourPosition)).toBe("");
        });
    });
});

describe("getGradientColor", () => {
    const originalDate = globalThis.Date;

    beforeEach(() => {
        const mockDate = vi.fn(() => ({
            getHours: () => 10,
        })) as unknown as DateConstructor;
        mockDate.now = originalDate.now;
        mockDate.parse = originalDate.parse;
        mockDate.UTC = originalDate.UTC;
        globalThis.Date = mockDate;
    });

    afterEach(() => {
        globalThis.Date = originalDate;
    });

    describe("for #tomorrow hash", () => {
        it("returns correct gradients based on task count thresholds", () => {
            const testCases: { tasks: number; expected: string | null }[] = [
                { tasks: 21, expected: "bg-gradient-to-r from-red-900 to-red-700" },
                { tasks: 25, expected: "bg-gradient-to-r from-red-900 to-red-700" },
                { tasks: 20, expected: "bg-gradient-to-r from-orange-800 to-orange-600" },
                { tasks: 19, expected: "bg-gradient-to-r from-orange-800 to-orange-600" },
                { tasks: 18, expected: null },
                { tasks: 17, expected: null },
                { tasks: 16, expected: "bg-gradient-to-r from-emerald-900 to-emerald-700" },
                { tasks: 15, expected: "bg-gradient-to-r from-emerald-900 to-emerald-700" },
                { tasks: 14, expected: "bg-gradient-to-r from-green-900 to-green-700" },
                { tasks: 13, expected: "bg-gradient-to-r from-green-900 to-green-700" },
                { tasks: 12, expected: "bg-gradient-to-r from-green-900 to-green-700" },
                { tasks: 11, expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
                { tasks: 5, expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
                { tasks: 0, expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
            ];

            testCases.forEach(({ tasks, expected }) => {
                expect(getGradientColor(tasks, "#tomorrow")).toBe(expected);
            });
        });
    });

    describe("for #today hash", () => {
        it("calculates threshold based on current hour and returns correct gradients", () => {
            const testCases: { tasks: number; expected: string | null }[] = [
                { tasks: 9, expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
                { tasks: 10, expected: "bg-gradient-to-r from-green-900 to-green-700" },
                { tasks: 11, expected: "bg-gradient-to-r from-emerald-900 to-emerald-700" },
                { tasks: 12, expected: null },
                { tasks: 13, expected: "bg-gradient-to-r from-orange-800 to-orange-600" },
                { tasks: 14, expected: "bg-gradient-to-r from-red-900 to-red-700" },
                { tasks: 20, expected: "bg-gradient-to-r from-red-900 to-red-700" },
            ];

            testCases.forEach(({ tasks, expected }) => {
                expect(getGradientColor(tasks, "#today")).toBe(expected);
            });
        });

        it("handles early morning hours correctly", () => {
            const mockDate = vi.fn(() => ({
                getHours: () => 6,
            })) as unknown as DateConstructor;
            mockDate.now = originalDate.now;
            mockDate.parse = originalDate.parse;
            mockDate.UTC = originalDate.UTC;
            globalThis.Date = mockDate;

            const testCases: { tasks: number; expected: string | null }[] = [
                { tasks: 11, expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
                { tasks: 12, expected: "bg-gradient-to-r from-green-900 to-green-700" },
                { tasks: 13, expected: "bg-gradient-to-r from-emerald-900 to-emerald-700" },
                { tasks: 14, expected: null },
                { tasks: 15, expected: "bg-gradient-to-r from-orange-800 to-orange-600" },
                { tasks: 16, expected: "bg-gradient-to-r from-red-900 to-red-700" },
            ];

            testCases.forEach(({ tasks, expected }) => {
                expect(getGradientColor(tasks, "#today")).toBe(expected);
            });
        });
    });

    it("returns empty string for unknown hash values", () => {
        ["#someday", "#next-week", "", "#unknown"].forEach((hash: string) => {
            expect(getGradientColor(10, hash)).toBe("");
        });
    });

    it("handles edge cases", () => {
        const edgeCases: { tasks: number; hash: string; expected: string | null }[] = [
            { tasks: 0, hash: "#tomorrow", expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
            { tasks: 0, hash: "#today", expected: "bg-gradient-to-r from-blue-900 to-blue-700" },
            { tasks: 100, hash: "#tomorrow", expected: "bg-gradient-to-r from-red-900 to-red-700" },
            { tasks: 100, hash: "#today", expected: "bg-gradient-to-r from-red-900 to-red-700" },
        ];

        edgeCases.forEach(({ tasks, hash, expected }) => {
            expect(getGradientColor(tasks, hash)).toBe(expected);
        });
    });

    it("handles non-numeric task values", () => {
        expect(getGradientColor(NaN, "#tomorrow")).toBe(null);
        expect(getGradientColor(Infinity, "#tomorrow")).toBe(
            "bg-gradient-to-r from-red-900 to-red-700",
        );
        expect(getGradientColor(-Infinity, "#tomorrow")).toBe(
            "bg-gradient-to-r from-blue-900 to-blue-700",
        );

        expect(getGradientColor(NaN, "#today")).toBe("");
    });
});
