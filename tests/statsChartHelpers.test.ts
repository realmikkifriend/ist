import { describe, expect, it } from "vitest";
import { dayLabel } from "../src/utils/statsChartHelpers";

describe("dayLabel", () => {
    it("shows the full date on the first row", () => {
        expect(dayLabel("2026-10-03")).toBe("2026 Oct 03 Sat");
    });

    it("shows day and weekday only within the same month", () => {
        expect(dayLabel("2026-10-02", "2026-10-03")).toBe("02 Fri");
        expect(dayLabel("2026-10-01", "2026-10-02")).toBe("01 Thu");
    });

    it("adds the month at a month boundary", () => {
        expect(dayLabel("2026-09-30", "2026-10-01")).toBe("Sep 30 Wed");
    });

    it("adds the year at a year boundary mid-window", () => {
        expect(dayLabel("2025-12-31", "2026-01-02")).toBe("2025 Dec 31 Wed");
        expect(dayLabel("2026-01-02", "2026-01-03")).toBe("02 Fri");
        expect(dayLabel("2025-01-01", "2025-12-31")).toBe("Jan 01 Wed");
    });
});
