import { expect, type Page } from "@playwright/test";
import { DateTime } from "luxon";
import { mockDynalistDocument } from "./mock-dynalist";
import { mockTodoistApi } from "./mock";
import { makeScenario } from "./scenarios";
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
 * Builds a local Date at a given hour/minute, offset from now by a number of
 * days. Fixed hours keep the tasks inside the intended day regardless of when
 * the suite runs (avoids the past-midnight edge that "now minus X hours" has).
 * @param {number} offsetDays - Days to offset from today (0 = today).
 * @param {number} hour - The hour of the day to use (0-23).
 * @param {number} [minute] - The minute of the hour (defaults to 0).
 * @returns {Date} A local Date at the offset day's given hour and minute.
 */
export function atHour(offsetDays: number, hour: number, minute: number = 0): Date {
    const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    date.setHours(hour, minute, 0, 0);
    return date;
}

/**
 * Opens the agenda view for the given hash (e.g. "#today") and waits for the
 * agenda container to be visible.
 * @param {Page} page - The browser page.
 * @param {string} hash - The agenda view hash to navigate to.
 * @returns {Promise<void>} Resolves once the agenda is visible.
 */
export async function openAgenda(page: Page, hash: string): Promise<void> {
    await page.evaluate((h) => (window.location.hash = h), hash);
    await expect(page.locator("#agenda")).toBeVisible();
}

/**
 * Builds a Todoist comment carrying a Dynalist document URL on task-alpha
 * (the default scenario's first due task).
 * @param {string} url - The `https://dynalist.io/d/...` URL to embed.
 * @returns {Record<string, unknown>} The raw comment.
 */
export function dynalistComment(url: string): Record<string, unknown> {
    return {
        id: "comment-dynalist",
        item_id: "task-alpha",
        content: url,
        posted_at: new Date().toISOString(),
        file_attachment: null,
        posted_uid: "17324928",
        uids_to_notify: null,
        reactions: null,
        is_deleted: false,
    };
}

/**
 * Loads the app against the default scenario with a task-alpha comment linking
 * to a Dynalist document, mocking both the Todoist and Dynalist APIs.
 * @param {Page} page - The browser page to load.
 * @param {string} url - The Dynalist document URL to embed in the comment.
 * @param {Record<string, unknown>} document - The document served on `doc/read`.
 * @param {boolean} [withToken] - Whether to seed a Dynalist access token (default true).
 * @returns {Promise<{ edits: () => Record<string, unknown>[][] }>} The Dynalist mock handle.
 */
export async function loadDynalist(
    page: Page,
    url: string,
    document: Record<string, unknown>,
    withToken: boolean = true,
) {
    const seed: Record<string, unknown> = { todoist_access_token: TODOIST_TOKEN };
    if (withToken) seed.dynalist_access_token = DYNALIST_TOKEN;
    await seedLocalStorage(page, seed);
    await mockTodoistApi(
        page,
        makeScenario({ comments: { "task-alpha": [dynalistComment(url)] } }),
    );
    const handle = await mockDynalistDocument(page, document);
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
