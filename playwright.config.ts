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
            command: "npm run build && node tests/e2e/static-server.mjs 9181 dist",
            url: "http://127.0.0.1:9181",
            reuseExistingServer: true,
            timeout: 180_000,
        },
        {
            // Same as `npm start` but without `--open`, so running tests never
            // pops a browser window on the developer's machine.
            // Pinned to port 9180 (webpack's default is 8080) so the test
            // dev server never collides with the developer's live server.
            command: "dotenv -- webpack serve --mode development --no-stats --port 9180",
            url: "http://localhost:9180",
            reuseExistingServer: true,
            timeout: 180_000,
        },
    ],
    projects: [
        {
            name: "offline",
            // The live smoke spec talks to the real api.todoist.com and needs
            // the dev server's /oauth proxy, so it only runs in `live`.
            testIgnore: "live.todoist.spec.ts",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: "http://127.0.0.1:9181",
            },
        },
        {
            name: "live",
            use: {
                ...devices["Desktop Chrome"],
                baseURL: "http://localhost:9180",
            },
        },
    ],
});
