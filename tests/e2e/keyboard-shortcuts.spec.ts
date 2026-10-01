import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { makeActivityEvent } from "./mock-activity";
import { loadApp } from "./helpers";
import { makeScenario } from "./scenarios";

test.describe("keyboard shortcuts", () => {
    test("the ? key toggles the keyboard shortcut labels", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        // kbd labels are display:none without show-kbd, so the done button has
        // no "CTRL+Enter" in its accessible name.
        await expect(page.getByRole("button", { name: "CTRL+Enter" })).toHaveCount(0);

        await page.keyboard.press("Shift+?");
        await expect(page.getByRole("button", { name: "CTRL+Enter" })).toBeVisible();

        await page.keyboard.press("Shift+?");
        await expect(page.getByRole("button", { name: "CTRL+Enter" })).toHaveCount(0);
    });

    test("Escape closes the defer and task-search modals", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.keyboard.press("d");
        await expect(page.locator("#defer_modal")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator("#defer_modal")).toBeHidden();

        await page.keyboard.press("/");
        const input = page.locator("#task_search_modal_input");
        await expect(input).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(input).toBeHidden();
    });

    test("the arrow keys change the month in the calendar modal", async ({ page }) => {
        const scenario = makeScenario({
            activity: { "task-alpha": [makeActivityEvent("task-alpha", new Date())] },
        });
        await loadApp(page, scenario);
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.keyboard.press("h");
        // The month-name element (the header's kbd labels and the day-of-week
        // labels both carry font-bold / extra text).
        const header = page.locator("#calendar_modal_task-alpha div.mt-5 div.font-bold");
        await expect(header).toHaveText(DateTime.now().toFormat("LLLL yyyy"));

        // The history calendar is bounded to the present, so the previous
        // month is the reachable direction.
        await page.keyboard.press("ArrowUp");
        await expect(header).toHaveText(DateTime.now().minus({ months: 1 }).toFormat("LLLL yyyy"));
    });
});
