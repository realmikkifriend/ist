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

    test("silent token exchange failure leaves the user on the Authenticating screen", async ({
        page,
    }) => {
        await page.route("**/oauth/access_token", (route) =>
            route.fulfill({ status: 500, json: { error: "Simulated failure" } }),
        );

        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
            if (msg.type() === "error") {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto("/?code=e2e-fail");

        // The console error is the only observable failure signal (no error UI exists).
        await expect
            .poll(() => consoleErrors.join("\n"))
            .toContain("Failed to exchange code for token");

        await expect(page.getByText("Authenticating...")).toBeVisible();
        expect(page.url()).toContain("?code=e2e-fail");
        expect(await page.evaluate(() => localStorage.getItem("todoist_access_token"))).toBeNull();
        await expect(page.getByRole("link", { name: "Continue with Todoist" })).toBeHidden();
        expect(await page.locator(".toast").count()).toBe(0);
    });
});
