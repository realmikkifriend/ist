import type { Page } from "@playwright/test";

/**
 * Seeds localStorage (JSON-serialized, matching svelte-persisted-store) before
 * any app script runs.
 * @param {Page} page - Playwright page to seed.
 * @param {Record<string, unknown>} entries - Storage keys mapped to values.
 * @returns {Promise<void>} Resolves once the init script is registered.
 */
export async function seedLocalStorage(
    page: Page,
    entries: Record<string, unknown>,
): Promise<void> {
    await page.addInitScript((initial) => {
        Object.entries(initial).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }, entries);
}
