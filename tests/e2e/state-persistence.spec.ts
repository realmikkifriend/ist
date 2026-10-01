import { expect, test } from "@playwright/test";
import {
    DYNALIST_TOKEN,
    TODOIST_TOKEN,
    loadApp,
    openAgenda,
    openSidebar,
    readSelectedContext,
    selectContext,
} from "./helpers";
import { E2E_CONTEXTS } from "./mock-data";
import { mockTodoistApi } from "./mock";
import { makeMultiContextScenario, makeScenario } from "./scenarios";
import { seedLocalStorage } from "./seed";

test.describe("state persistence & reset", () => {
    test("selected context and displayed task persist across reload", async ({ page }) => {
        await loadApp(page, makeScenario(makeMultiContextScenario()));
        await expect(page.getByRole("heading", { name: "Inbox due task" })).toBeVisible();

        await selectContext(page, /Gardening/);
        await expect(page.getByRole("heading", { name: "Gardening due task" })).toBeVisible();
        await expect(page.getByText("left in Gardening")).toBeVisible();

        await page.reload();

        // The selected context is restored from localStorage, and the display is
        // re-derived as the first-due task of that context from the restored data.
        await expect(page.getByRole("heading", { name: "Gardening due task" })).toBeVisible();
        await expect(page.getByText("left in Gardening")).toBeVisible();
        await expect(readSelectedContext(page)).resolves.toEqual({
            id: E2E_CONTEXTS.gardening,
            name: "Gardening",
        });
    });

    test("a persisted summoned task is cleared on reload, taking the normal load path", async ({
        page,
    }) => {
        const handle = await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openAgenda(page, "#tomorrow");
        await page.getByRole("button", { name: "12:00" }).click();
        await expect(page.getByRole("heading", { name: "Delta tomorrow task" })).toBeVisible();

        const fetchesBeforeReload = handle.taskFetches();
        await page.reload();

        // The persisted summoned task is cleared on load, so the normal load
        // path runs: the initial refresh happens and the display is re-derived
        // as the first-due task.
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        // The display can render from persisted data before the initial refresh
        // fetch lands, so poll for the fetch rather than asserting immediately.
        await expect.poll(() => handle.taskFetches()).toBe(fetchesBeforeReload + 1);
    });

    test("logging out resets all persisted state to the landing page", async ({ page }) => {
        await seedLocalStorage(page, {
            todoist_access_token: TODOIST_TOKEN,
            dynalist_access_token: DYNALIST_TOKEN,
        });
        await mockTodoistApi(page, makeScenario());
        await page.goto("/");
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openSidebar(page);
        await page.getByRole("button", { name: "Log Out" }).click();

        await expect(page.getByRole("heading", { name: "One Task at a Time" })).toBeVisible();
        const keys = [
            "todoist_data",
            "displayTask",
            "task_activity",
            "user_settings",
            "todoist_access_token",
            "dynalist_access_token",
        ];
        const remaining = await page.evaluate(
            (storedKeys: string[]) =>
                storedKeys.filter((key) => localStorage.getItem(key) !== null),
            keys,
        );
        expect(remaining).toEqual([]);
    });
});
