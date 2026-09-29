import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const ENV_PATH = path.join(__dirname, "..", "..", ".env");

/**
 * Reads an env var (environment first, then .env key=value lines), so the
 * spec has no extra npm deps.
 * @param {string} name - The env var name.
 * @returns {string | null} The value, or null when not set.
 */
function envValue(name: string): string | null {
    if (process.env[name]) {
        return process.env[name];
    }
    if (!existsSync(ENV_PATH)) {
        return null;
    }
    const match = readFileSync(ENV_PATH, "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/))
        .find((line) => line?.[1] === name);
    return match ? match[2].replace(/^["']|["']$/g, "") : null;
}

test.describe("live Todoist smoke", () => {
    // Live network calls can exceed the default 30 s spec timeout.
    test.describe.configure({ timeout: 60_000 });

    test("renders real data from api.todoist.com", async ({ page }, testInfo) => {
        // The offline project is served by a static server with no /oauth
        // proxy, so the smoke test only runs against the dev server.
        test.skip(
            testInfo.project.name !== "live",
            "live smoke runs only against the `live` (dev server) project",
        );

        const token = envValue("TODOIST_ACCESS_TOKEN");
        if (!token) {
            throw new Error(
                "TODOIST_ACCESS_TOKEN is missing from .env (or the environment). " +
                    "Copy the token from a logged-in browser's localStorage " +
                    "(key `todoist_access_token`) and add it to .env.",
            );
        }

        // Seed the long-lived token so the app is authenticated on load; no
        // routes are mocked, so the app hits the real api.todoist.com. The
        // store (svelte-persisted-store) JSON-encodes its values, so the
        // localStorage entry must be a JSON string.
        await page.addInitScript(
            ({ token }) => {
                localStorage.setItem("todoist_access_token", JSON.stringify(token));
            },
            { token },
        );

        await page.goto("/");

        await expect(page.getByRole("heading", { name: "One Task at a Time" })).toBeHidden();
        await expect(page.getByText("Error loading Todoist data:")).toHaveCount(0);
        await expect(
            page.locator("h2.card-title").or(page.getByText("No due tasks...")),
        ).toBeVisible();
    });
});
