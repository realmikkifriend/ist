import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e configuration.
 *
 * `webServer` is top-level in Playwright, so both servers start for every
 * run: the static server (serving the fresh production build, used by the
 * deterministic `offline` project) and the dev server (`npm start`, needed by
 * the `live` project because it proxies `/oauth` to todoist.com).
 */
export default defineConfig({
    testDir: "./tests/e2e",
    // Downloads the (not committed) Todoist fixtures when they are missing.
    globalSetup: "./tests/e2e/global-setup.mjs",
    timeout: 30_000,
    fullyParallel: true,
    reporter: [["list"]],
    webServer: [
        {
            command: "npm run build && node tests/e2e/static-server.mjs 8081 dist",
            url: "http://127.0.0.1:8081",
            reuseExistingServer: true,
            timeout: 180_000,
        },
        {
            // Same as `npm start` but without `--open`, so running tests never
            // pops a browser window on the developer's machine.
            command: "dotenv -- webpack serve --mode development --no-stats",
            url: "http://localhost:8080",
            reuseExistingServer: true,
            timeout: 180_000,
        },
    ],
    projects: [
        {
            name: "offline",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: "http://127.0.0.1:8081",
            },
        },
        {
            name: "live",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: "http://localhost:8080",
            },
        },
    ],
});
