import { expect, test } from "@playwright/test";
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
});
