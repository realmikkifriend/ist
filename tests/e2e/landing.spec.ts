import { expect, test } from "@playwright/test";

test.describe("Landing page", () => {
    test("renders the hero heading and the Todoist entry point", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "One Task at a Time" })).toBeVisible();
        await expect(page.getByText(/Todoist/).first()).toBeVisible();
    });
});
