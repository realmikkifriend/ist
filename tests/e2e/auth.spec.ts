import { expect, test } from "@playwright/test";
import { TODOIST_TOKEN } from "./helpers";
import { mockTodoistApi } from "./mock";
import { makeScenario } from "./scenarios";

test.describe("auth & onboarding", () => {
    test("full login flow displays the first due task", async ({ page }) => {
        await mockTodoistApi(page, makeScenario());
        await page.goto("/");
        const origin = new URL(page.url()).origin;

        await page.route("**/todoist.com/oauth/authorize**", (route) =>
            route.fulfill({
                status: 302,
                headers: { location: `${origin}/?code=e2e-auth-code` },
            }),
        );
        await page.route("**/oauth/access_token", (route) =>
            route.fulfill({ status: 200, json: { access_token: TODOIST_TOKEN } }),
        );

        await expect(page.getByRole("heading", { name: "One Task at a Time" })).toBeVisible();
        await page.getByRole("link", { name: "Continue with Todoist" }).click();

        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });
});
