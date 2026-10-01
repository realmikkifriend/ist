import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { loadApp } from "./helpers";
import { makeScenario } from "./scenarios";

test.describe("agenda", () => {
    test("summoning a task from the agenda closes it and displays the task", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.evaluate(() => {
            window.location.hash = "#tomorrow";
        });
        await expect(page.locator("#agenda")).toBeVisible();

        await page.getByRole("button", { name: "12:00" }).click();

        await expect(page.locator("#agenda")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Delta tomorrow task" })).toBeVisible();
    });

    test("scheduling from the agenda defers the task to the picked time", async ({ page }) => {
        const handle = await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.evaluate(() => {
            window.location.hash = "#tomorrow";
        });
        await expect(page.locator("#agenda")).toBeVisible();

        // Delta is the only task due tomorrow; its chevron opens the ScheduleModal.
        await page.locator("#agenda").getByTitle("Schedule task").first().click();
        const modal = page.locator("#schedule_modal_task-delta");
        await expect(modal).toBeVisible();
        await modal.getByRole("button", { name: "Select 9 AM" }).click();
        await modal.getByRole("button", { name: "9:00 AM" }).click();

        await expect(
            page.getByRole("button", { name: "Task scheduled successfully." }),
        ).toBeVisible();
        const tomorrow = DateTime.now().plus({ days: 1 });
        const updates = handle.updates().filter((entry) => entry.id === "task-delta");
        expect(updates.length).toBe(1);
        expect(updates[0].body.due_datetime).toBe(`${tomorrow.toISODate()}T09:00:00`);
    });
});
