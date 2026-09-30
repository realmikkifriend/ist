import { expect, test } from "@playwright/test";
import { loadApp } from "./helpers";
import { makeScenario } from "./scenarios";

test.describe("contexts", () => {
    test("context filter turns on and off", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page.locator(".menu").getByRole("button", { name: /Home/ }).click();
        await expect(page.getByRole("heading", { name: "Gamma due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page.locator(".menu").getByRole("button", { name: /Home/ }).click();
        // Deselecting the context surfaces the new-first-due-task toast; confirm it.
        await page.getByRole("button", { name: /New first-due task/ }).click();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });
});
