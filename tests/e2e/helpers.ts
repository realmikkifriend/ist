import type { Page } from "@playwright/test";
import { mockTodoistApi } from "./mock";
import type { makeScenario } from "./scenarios";
import { seedLocalStorage } from "./seed";

export const TODOIST_TOKEN = "e2e-todoist-token";
export const DYNALIST_TOKEN = "e2e-dynalist-token";

/**
 * Loads the app authenticated (seeded Todoist token) against the given
 * scenario, returning the mock API handle for driving and observing the
 * mock mid-test.
 * @param {Page} page - The browser page to load.
 * @param {ReturnType<typeof makeScenario>} scenario - The mocked API data.
 * @returns {Promise<Awaited<ReturnType<typeof mockTodoistApi>>>} The mock API handle.
 */
export async function loadApp(
    page: Page,
    scenario: ReturnType<typeof makeScenario>,
): Promise<Awaited<ReturnType<typeof mockTodoistApi>>> {
    await seedLocalStorage(page, { todoist_access_token: TODOIST_TOKEN });
    const handle = await mockTodoistApi(page, scenario);
    await page.goto("/");
    return handle;
}
