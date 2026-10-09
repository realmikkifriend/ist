import { expect, test, type Page } from "@playwright/test";
import { DateTime } from "luxon";
import { loadApp, openSidebar } from "./helpers";
import {
    makeLongestIdleLimitScenario,
    makeStatsScenario,
    makeStatsScenarioWithNeverDoneTask,
} from "./stats-scenarios";

const isoDaysAgo = (days: number): string => DateTime.now().minus({ days }).toISODate() ?? "";

const openStats = async (page: Page): Promise<void> => {
    await page.evaluate(() => (window.location.hash = "#stats"));
    await expect(page.locator("#stats")).toBeVisible();
};

test.describe("stats", () => {
    test("the stats view opens, toggles, navigates, and closes", async ({ page }) => {
        await loadApp(page, makeStatsScenario());
        await openSidebar(page);
        await page.getByRole("button", { name: "Stats" }).click();
        await expect(page).toHaveURL(/#stats$/);
        await expect(page.locator("#stats")).toBeVisible();
        await page.keyboard.press("s");
        await expect(page.locator("#stats")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await page.keyboard.press("s");
        await expect(page.locator("#stats")).toBeVisible();
        await page.locator("#stats").getByRole("button", { name: "Agenda" }).click();
        await expect(page).toHaveURL(/#today$/);
        await expect(page.locator("#agenda")).toBeVisible();
        await page.locator("#agenda").getByRole("button", { name: "Stats" }).click();
        await expect(page).toHaveURL(/#stats$/);
        await expect(page.locator("#stats")).toBeVisible();
        await page.locator("#stats").getByRole("button", { name: "Close stats" }).click();
        await expect(page.locator("#stats")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await page.evaluate(() => (window.location.hash = "#today"));
        await expect(page.locator("#agenda")).toBeVisible();
        await page.goto("/#stats");
        await expect(page.locator("#stats")).toBeVisible();
    });

    test("completion history is fetched, stored, displayed, and reused after reload", async ({
        page,
    }) => {
        const handle = await loadApp(page, makeStatsScenario());
        const initialFetches = () =>
            handle.activityRequests().filter((req) => req.date_from === isoDaysAgo(28)).length;
        await openStats(page);
        await expect.poll(initialFetches).toBe(1);
        const doubleDay = page.locator(`#stats .stats-day[data-date="${isoDaysAgo(12)}"]`);
        await expect(doubleDay.locator(".stats-segment")).toHaveCount(2);
        await expect(doubleDay.getByText("2", { exact: true })).toBeVisible();
        const stored = await page.evaluate(
            () => (localStorage.getItem("task_activity") ?? "[]") !== "[]",
        );
        expect(stored).toBe(true);
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
        await page.getByRole("button", { name: "Load more" }).click();
        await expect
            .poll(() =>
                handle
                    .activityRequests()
                    .some(
                        (req) => req.date_from === isoDaysAgo(42) && req.date_to === isoDaysAgo(27),
                    ),
            )
            .toBe(true);
        await expect(
            page.locator(`#stats .stats-day[data-date="${isoDaysAgo(30)}"]`),
        ).toBeVisible();
    });

    test("the longest-idle list ranks tasks by days since their last completion", async ({
        page,
    }) => {
        await loadApp(page, makeStatsScenarioWithNeverDoneTask());
        await openStats(page);
        const items = page.locator("#stats .stats-longest-item");
        await expect(items).toHaveCount(6);
        // the never-done (routine) task carries no completion history and is excluded
        await expect(items.filter({ hasText: "Routine task" })).toHaveCount(0);
        // tasks with no completion in the retrieved window lead, labeled with the window size
        await expect(items.nth(0)).toContainText("Delta tomorrow task");
        await expect(items.nth(0)).toContainText("28+ days");
        await expect(items.nth(1)).toContainText("Epsilon no date");
        await expect(items.nth(1)).toContainText("28+ days");
        await expect(items.nth(2)).toContainText("Zeta no date");
        await expect(items.nth(2)).toContainText("28+ days");
        await expect(items.nth(3)).toContainText("Gamma due task");
        await expect(items.nth(3)).toContainText("28 days");
        await expect(items.nth(4)).toContainText("Beta due task");
        await expect(items.nth(4)).toContainText("12 days");
        await expect(items.nth(5)).toContainText("Alpha due task");
        await expect(items.nth(5)).toContainText("2 days");
    });

    test("out-of-window labels track the retrieved window after load more", async ({ page }) => {
        await loadApp(page, makeStatsScenario());
        await openStats(page);
        const items = page.locator("#stats .stats-longest-item");
        // zeta's only completion is 30 days back, outside the initial window
        await expect(items.nth(2)).toHaveText(/Zeta no date.*28\+ days/);
        await page.getByRole("button", { name: "Load more" }).click();
        await expect(items.nth(0)).toHaveText(/Delta tomorrow task.*42\+ days/);
        await expect(items.nth(1)).toHaveText(/Epsilon no date.*42\+ days/);
        await expect(items.nth(2)).toHaveText(/Zeta no date.*30 days/);
    });

    test("the longest-idle list is limited to the seven longest-idle entries", async ({ page }) => {
        await loadApp(page, makeLongestIdleLimitScenario());
        await openStats(page);
        const items = page.locator("#stats .stats-longest-item");
        await expect(items).toHaveCount(7);
        await expect(items.nth(0)).toContainText("Idle task 11");
        await expect(items.nth(0)).toContainText("11 days");
        await expect(items.nth(6)).toContainText("Idle task 5");
        await expect(items.nth(6)).toContainText("5 days");
        // the most recently completed task fell off the limited list
        await expect(
            page.locator("#stats .stats-longest").getByText("Idle task 1", { exact: true }),
        ).toHaveCount(0);
    });
});
