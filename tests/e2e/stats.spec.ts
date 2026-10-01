import { expect, test, type Page } from "@playwright/test";
import { DateTime } from "luxon";
import { loadApp, openSidebar } from "./helpers";
import { makeActivityEvent } from "./mock-activity";
import { E2E_PROJECTS } from "./mock-data";
import { makeScenario } from "./scenarios";

const isoDaysAgo = (days: number): string => DateTime.now().minus({ days }).toISODate() ?? "";

const daysAgoNoon = (days: number): Date =>
    DateTime.now()
        .minus({ days })
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
        .toJSDate();

// alpha (home context) completed 2 and 12 days ago; beta (self-care context)
// completed 12 and 30 days ago; gamma is never completed.
const makeStatsScenario = (): ReturnType<typeof makeScenario> =>
    makeScenario({
        activity: {
            "": [
                makeActivityEvent("task-alpha", daysAgoNoon(2)),
                makeActivityEvent("task-alpha", daysAgoNoon(12)),
                makeActivityEvent("task-beta", daysAgoNoon(12), {
                    parent_project_id: E2E_PROJECTS.selfCare,
                }),
                makeActivityEvent("task-beta", daysAgoNoon(30), {
                    parent_project_id: E2E_PROJECTS.selfCare,
                }),
            ],
        },
    });

const openStats = async (page: Page): Promise<void> => {
    await page.evaluate(() => (window.location.hash = "#stats"));
    await expect(page.locator("#stats")).toBeVisible();
};

test.describe("stats", () => {
    test("the sidebar button opens the stats view at #stats", async ({ page }) => {
        await loadApp(page, makeStatsScenario());
        await openSidebar(page);
        await page.getByRole("button", { name: "Stats" }).click();
        await expect(page).toHaveURL(/#stats$/);
        await expect(page.locator("#stats")).toBeVisible();
    });

    test("the stats view appears on a page load with the #stats hash", async ({ page }) => {
        await loadApp(page, makeStatsScenario());
        await page.goto("/#stats");
        await expect(page.locator("#stats")).toBeVisible();
    });

    test("closing the stats view restores the task view and the agenda views", async ({ page }) => {
        await loadApp(page, makeStatsScenario());
        await openStats(page);
        await page.locator("#stats").getByRole("button", { name: "Close stats" }).click();
        await expect(page.locator("#stats")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await page.evaluate(() => (window.location.hash = "#today"));
        await expect(page.locator("#agenda")).toBeVisible();
    });

    test("completion history is fetched, stored, and stacked by day and context", async ({
        page,
    }) => {
        const handle = await loadApp(page, makeStatsScenario());
        const initialFetches = () =>
            handle.activityRequests().filter((req) => req.date_from === isoDaysAgo(28)).length;
        await openStats(page);
        await expect.poll(initialFetches).toBe(1);
        // both contexts completed on this day, so the day stacks two segments
        const doubleDay = page.locator(`#stats .stats-day[data-date="${isoDaysAgo(12)}"]`);
        await expect(doubleDay.locator(".stats-segment")).toHaveCount(2);
        await expect(doubleDay.getByText("2", { exact: true })).toBeVisible();
        const stored = await page.evaluate(
            () => (localStorage.getItem("task_activity") ?? "[]") !== "[]",
        );
        expect(stored).toBe(true);
    });

    test("stored history is used without refetching on reload", async ({ page }) => {
        const handle = await loadApp(page, makeStatsScenario());
        const initialFetches = () =>
            handle.activityRequests().filter((req) => req.date_from === isoDaysAgo(28)).length;
        await openStats(page);
        await expect.poll(initialFetches).toBe(1);
        await page.reload();
        await openStats(page);
        await page.waitForTimeout(1500);
        expect(initialFetches()).toBe(1);
    });

    test("the retrieve-more button extends the window with only the missing chunk", async ({
        page,
    }) => {
        const handle = await loadApp(page, makeStatsScenario());
        await openStats(page);
        await expect(page.locator(`#stats .stats-day[data-date="${isoDaysAgo(30)}"]`)).toBeHidden();
        await page.getByRole("button", { name: "Retrieve more history" }).click();
        await expect
            .poll(() =>
                handle
                    .activityRequests()
                    .some(
                        (req) => req.date_from === isoDaysAgo(42) && req.date_to === isoDaysAgo(28),
                    ),
            )
            .toBe(true);
        await expect(
            page.locator(`#stats .stats-day[data-date="${isoDaysAgo(30)}"]`),
        ).toBeVisible();
    });

    test("the longest-idle list ranks by last completion and excludes never-completed", async ({
        page,
    }) => {
        await loadApp(page, makeStatsScenario());
        await openStats(page);
        const items = page.locator("#stats .stats-longest-item");
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toContainText("Beta due task");
        await expect(items.nth(1)).toContainText("Alpha due task");
        await expect(items.filter({ hasText: "Gamma due task" })).toHaveCount(0);
    });
});
