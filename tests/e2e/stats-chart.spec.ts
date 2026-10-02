import { expect, test, type Page } from "@playwright/test";
import { DateTime } from "luxon";
import { loadApp } from "./helpers";
import { daysAgoNoon, makeActivityEvent } from "./mock-activity";
import { makeScenario } from "./scenarios";
import { makeChartColumnScenario, makeStatsScenario } from "./stats-scenarios";

const isoDaysAgo = (days: number): string => DateTime.now().minus({ days }).toISODate() ?? "";

const openStats = async (page: Page): Promise<void> => {
    await page.evaluate(() => (window.location.hash = "#stats"));
    await expect(page.locator("#stats")).toBeVisible();
};

/**
 * Offsets (in days ago) for three chart rows: a Wednesday and the Tuesday
 * after it (same week), plus the Monday of the week before that (a different
 * week). Computed from the run date so all three fall inside the initial
 * 28-day window. Larger offsets are older (lower on the chart).
 * @returns {object} The three day offsets.
 */
const weekBoundaryOffsets = (): { wednesday: number; tuesday: number; previousMonday: number } => {
    const weekday = DateTime.now().weekday;
    const lastMonday = (weekday === 1 ? 7 : weekday - 1) + 7;
    return {
        wednesday: lastMonday - 2,
        tuesday: lastMonday - 1,
        previousMonday: lastMonday + 7,
    };
};

test.describe("stats chart", () => {
    test("the chart gives each context color its own centered column", async ({ page }) => {
        await loadApp(page, makeChartColumnScenario());
        await openStats(page);
        const wideDay = page.locator(`#stats .stats-day[data-date="${isoDaysAgo(1)}"]`);
        await expect(wideDay.locator(".stats-segment")).toHaveCount(1);
        const narrowDay = page.locator(`#stats .stats-day[data-date="${isoDaysAgo(4)}"]`);
        await expect(narrowDay.locator(".stats-segment")).toHaveCount(2);
        const wideBox = (await wideDay.locator(".stats-segment").boundingBox())!;
        const berryBox = (await narrowDay.locator(".stats-segment").nth(0).boundingBox())!;
        const blueBox = (await narrowDay.locator(".stats-segment").nth(1).boundingBox())!;
        // the color with the busiest single day gets a wider column
        expect(wideBox.width / berryBox.width).toBeGreaterThan(2);
        // bars of the same color are centered in their shared column
        const center = (box: { x: number; width: number }): number => box.x + box.width / 2;
        expect(Math.abs(center(wideBox) - center(blueBox))).toBeLessThan(2);
    });

    test("the chart shows a gap between rows of different weeks", async ({ page }) => {
        const { wednesday, tuesday, previousMonday } = weekBoundaryOffsets();
        await loadApp(
            page,
            makeScenario({
                activity: {
                    "": [
                        makeActivityEvent("task-alpha", daysAgoNoon(wednesday)),
                        makeActivityEvent("task-alpha", daysAgoNoon(tuesday)),
                        makeActivityEvent("task-alpha", daysAgoNoon(previousMonday)),
                    ],
                },
            }),
        );
        await openStats(page);
        const rowTop = async (days: number): Promise<number> => {
            const box = (
                await page
                    .locator(`#stats .stats-day[data-date="${isoDaysAgo(days)}"]`)
                    .boundingBox()
            )!;
            return box.y;
        };
        const wed = await rowTop(wednesday);
        const tue = await rowTop(tuesday);
        const mon = await rowTop(previousMonday);
        // same-week rows keep their normal spacing
        expect(tue - wed).toBeCloseTo(14, 1);
        // the row from the previous week is pushed down by the week gap
        expect(mon - tue).toBeGreaterThan(16.5);
    });

    test("the oldest day's tooltip opens upward", async ({ page }) => {
        // Short viewport so the stats content overflows and the page scrolls —
        // a hidden tooltip below the last row would then extend the scrollable
        // area, leaving empty space at the bottom of the page.
        await page.setViewportSize({ width: 1280, height: 300 });
        await loadApp(page, makeStatsScenario());
        await openStats(page);
        const rows = page.locator("#stats .stats-row");
        await expect(rows.first()).toBeVisible();
        await expect(rows.last()).toHaveClass(/tooltip-top/);
        await rows.last().hover();
        const tip = rows.last().locator(".tooltip-content");
        await expect(tip).toBeVisible();
        const rowBox = (await rows.last().boundingBox())!;
        const tipBox = (await tip.boundingBox())!;
        expect(tipBox.y + tipBox.height).toBeLessThan(rowBox.y);
        const metrics = await page.evaluate(() => ({
            scrollHeight: document.documentElement.scrollHeight,
            statsBottom:
                (document.querySelector("#stats") as HTMLElement).getBoundingClientRect().bottom +
                window.scrollY,
        }));
        expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.statsBottom + 8);
    });

    test("the day tooltip is centered on the page on narrow screens", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 700 });
        await loadApp(page, makeStatsScenario());
        await openStats(page);
        const row = page.locator("#stats .stats-row").first();
        await expect(row).toBeVisible();
        await row.hover();
        const tip = row.locator(".tooltip-content");
        await expect(tip).toBeVisible();
        const tipBox = (await tip.boundingBox())!;
        const statsBox = (await page.locator("#stats").boundingBox())!;
        expect(tipBox.x).toBeGreaterThanOrEqual(0);
        expect(tipBox.x + tipBox.width).toBeLessThanOrEqual(375);
        const center = (x: number, width: number): number => x + width / 2;
        expect(
            Math.abs(center(tipBox.x, tipBox.width) - center(statsBox.x, statsBox.width)),
        ).toBeLessThan(4);
    });
});
