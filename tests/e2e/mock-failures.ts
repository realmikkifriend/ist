import type { Page } from "@playwright/test";

const CORS_HEADERS: Record<string, string> = { "access-control-allow-origin": "*" };

/**
 * Registers failure routes that take precedence over `mockTodoistApi` (call
 * this after it) so selected Todoist API calls can be made to fail. Matched
 * calls are answered with an HTTP 500 (the app sees the SDK `HTTP 500:` error
 * for that response), or aborted as a network error when the mode is "network".
 * Non-matching requests fall through to the earlier routes.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {object} [targets] - Which calls to fail.
 * @param {boolean} [targets.refresh] - Fail the refresh GET `tasks` endpoint.
 * @param {boolean | string[]} [targets.done] - Fail `close` calls (all, or the given task ids).
 * @param {boolean | string[]} [targets.defer] - Fail task-update calls (all, or the given task ids).
 * @param {"http" | "network"} [mode] - How matched calls fail (default "http").
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function failTodoistRoutes(
    page: Page,
    targets: {
        refresh?: boolean;
        done?: boolean | string[];
        defer?: boolean | string[];
    } = {},
    mode: "http" | "network" = "http",
): Promise<void> {
    const isTargeted = (target: boolean | string[] | undefined, id: string | undefined): boolean =>
        target === true || (Array.isArray(target) && id !== undefined && target.includes(id));

    await page.route("**/api.todoist.com/api/v1/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname.replace(/.*\/api\/v1\//, "");
        const closeMatch = path.match(/^tasks\/([^/]+)\/close$/);
        const updateMatch = closeMatch ? null : path.match(/^tasks\/([^/]+)$/);
        const shouldFail =
            (targets.refresh === true && request.method() === "GET" && path === "tasks") ||
            (closeMatch !== null &&
                request.method() === "POST" &&
                isTargeted(targets.done, closeMatch[1])) ||
            (updateMatch !== null &&
                request.method() === "POST" &&
                isTargeted(targets.defer, updateMatch[1]));

        if (!shouldFail) {
            await route.fallback();
            return;
        }
        if (mode === "network") {
            await route.abort();
            return;
        }
        await route.fulfill({
            status: 500,
            headers: CORS_HEADERS,
            json: { error: "Simulated failure" },
        });
    });
}
