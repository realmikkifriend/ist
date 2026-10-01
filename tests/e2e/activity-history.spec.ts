import { expect, test, type Page } from "@playwright/test";
import { makeActivityEvent } from "./mock-activity";
import { clickDoneButton, loadApp, openSidebar } from "./helpers";
import { makeScenario } from "./scenarios";

// The non-wrapping "N / M tasks done" label sitting next to the daily-goal pill.
const pillCount = (page: Page) => page.locator("div.ml-2.text-nowrap");

// The daily-goal pill itself (its onclick reloads today's activity).
const dailyGoalPill = (page: Page) => page.getByTitle("Reload activity stats");

test.describe("activity & history", () => {
    test("daily goal pill shows today's completions with a lime overflow", async ({ page }) => {
        // Eight completions against the fixture's goal of seven: the pill spills
        // into a lime overflow segment.
        const events = Array.from({ length: 8 }, (_, i) =>
            makeActivityEvent(`done-task-${i}`, new Date()),
        );
        await loadApp(page, makeScenario({ activity: { "": events } }));
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openSidebar(page);
        // The count updates on the pill's (debounced) initial activity reload.
        await expect(pillCount(page)).toContainText("8 / 7 tasks done");
        await expect(page.locator("div.border-lime-500")).toBeVisible();
        await expect(page.locator("span.text-lime-500")).toContainText("8");
    });

    test("a temporary activity entry is added on done and survives a reload", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        // Let the initial debounce expire so the reload below is the post-done one.
        await page.waitForTimeout(2300);

        await clickDoneButton(page);
        await expect(page.getByRole("button", { name: "Task marked done." })).toBeVisible();

        await openSidebar(page);
        // The temporary entry is picked up on the next (debounced) activity reload.
        await expect(pillCount(page)).toContainText("1 / 7 tasks done");

        // Clicking the pill reloads activity; the (still unconfirmed) temporary
        // entry must survive the reload rather than being dropped.
        await dailyGoalPill(page).click();
        await expect(pillCount(page)).toContainText("1 / 7 tasks done");
    });

    test("task history calendar shows completion dates and disables future days", async ({
        page,
    }) => {
        // A completion for the displayed task (task-alpha), dated today so it is
        // guaranteed to land in the currently rendered month.
        const scenario = makeScenario({
            activity: { "task-alpha": [makeActivityEvent("task-alpha", new Date())] },
        });
        await loadApp(page, scenario);
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.keyboard.press("h");
        await expect(page.locator("#calendar_modal_task-alpha")).toBeVisible();
        // A blue completion dot on the completed day.
        await expect(page.locator("#calendar_modal_task-alpha .bg-blue-500")).toBeVisible();
        // Future days (including the trailing next-month days) are disabled.
        await expect(
            page.locator("#calendar_modal_task-alpha button[disabled]").first(),
        ).toBeVisible();
    });
});
