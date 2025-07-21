import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { getTaskTime, createDateWithTime } from "../src/js/time";

describe("getTaskTime", () => {
    it("extracts hour and minute from a string with time", () => {
        const result = getTaskTime("Remind me at 3:45pm");
        expect(result).toEqual({ hour: 15, minute: 45 });
    });

    it("extracts hour and minute from a string with hour only", () => {
        const result = getTaskTime("Meeting at 8am");
        expect(result).toEqual({ hour: 8, minute: 0 });
    });

    it("returns null if no time is present", () => {
        const result = getTaskTime("No time here");
        expect(result).toBeNull();
    });

    it("handles midnight correctly", () => {
        const result = getTaskTime("Start at 12:00am");
        expect(result).toEqual({ hour: 0, minute: 0 });
    });

    it("handles noon correctly", () => {
        const result = getTaskTime("Lunch at 12:00pm");
        expect(result).toEqual({ hour: 12, minute: 0 });
    });

    it("returns null for empty string", () => {
        const result = getTaskTime("");
        expect(result).toBeNull();
    });
});

describe("createDateWithTime", () => {
    it("returns formatted time and new DateTime when time is present", () => {
        const base = DateTime.fromISO("2025-07-21T09:00:00");
        const { extractedTime, newDate } = createDateWithTime("call at 2:30pm", base);
        expect(extractedTime).toBe("2:30 PM");
        expect(newDate?.hour).toBe(14);
        expect(newDate?.minute).toBe(30);
        expect(newDate?.second).toBe(0);
        expect(newDate?.millisecond).toBe(0);
        expect(newDate?.year).toBe(2025);
        expect(newDate?.month).toBe(7);
        expect(newDate?.day).toBe(21);
    });

    it("formats hour-only times as 'h a'", () => {
        const base = DateTime.fromISO("2025-07-21T00:00:00");
        const { extractedTime, newDate } = createDateWithTime("wake up at 6am", base);
        expect(extractedTime).toBe("6 AM");
        expect(newDate?.hour).toBe(6);
        expect(newDate?.minute).toBe(0);
    });

    it("returns nulls if no time is found", () => {
        const base = DateTime.fromISO("2025-07-21T09:00:00");
        const { extractedTime, newDate } = createDateWithTime("just a note", base);
        expect(extractedTime).toBeNull();
        expect(newDate).toBeNull();
    });

    it("uses DateTime.now() if no base date is provided", () => {
        const { extractedTime, newDate } = createDateWithTime("11:15pm");
        expect(extractedTime).toBe("11:15 PM");
        expect(newDate).toBeInstanceOf(DateTime);
    });

    it("handles edge case: midnight", () => {
        const base = DateTime.fromISO("2025-07-21T09:00:00");
        const { extractedTime, newDate } = createDateWithTime("at 12:00am", base);
        expect(extractedTime).toBe("12 AM");
        expect(newDate?.hour).toBe(0);
        expect(newDate?.minute).toBe(0);
    });

    it("handles edge case: noon", () => {
        const base = DateTime.fromISO("2025-07-21T09:00:00");
        const { extractedTime, newDate } = createDateWithTime("at 12:00pm", base);
        expect(extractedTime).toBe("12 PM");
        expect(newDate?.hour).toBe(12);
        expect(newDate?.minute).toBe(0);
    });
});
