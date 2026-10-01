import type { Page } from "@playwright/test";
import { DateTime } from "luxon";
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

/**
 * Builds a due moment earlier today (never yesterday, so a task with this due
 * is due but not overdue, which leaves it untouched by the overdue
 * auto-defer).
 * @returns {DateTime} A local moment a little before now, clamped to today.
 */
export function dueEarlierToday(): DateTime {
    const now = DateTime.now();
    const minutesNow = now.hour * 60 + now.minute;
    const minutesAgo = Math.max(0, Math.min(minutesNow - 30, minutesNow - 1));
    return now.set({
        hour: Math.floor(minutesAgo / 60),
        minute: minutesAgo % 60,
        second: 0,
        millisecond: 0,
    });
}
