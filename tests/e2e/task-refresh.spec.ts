import { expect, test, type Page } from "@playwright/test";
import { failTodoistRoutes } from "./mock-failures";
import { dueObject, makeTask } from "./mock-data";
import { mockTodoistApi } from "./mock";
import { seedLocalStorage } from "./seed";
import { makeScenario } from "./scenarios";

const TODOIST_TOKEN = "e2e-todoist-token";
const MINUTE = 60 * 1000;
const alphaTask = makeTask("task-alpha", "Alpha due task", {
    due: dueObject(new Date(Date.now() - 90 * MINUTE)),
});
const betaTask = makeTask("task-beta", "Beta due task", {
    due: dueObject(new Date(Date.now() - 45 * MINUTE)),
});

/**
 * Loads the app authenticated against the given scenario.
 * @param {Page} page - The browser page to load.
 * @param {ReturnType<typeof makeScenario>} scenario - The mocked API data.
 * @returns {Promise<Awaited<ReturnType<typeof mockTodoistApi>>>} The mock API handle.
 */
async function loadApp(
    page: Page,
    scenario: ReturnType<typeof makeScenario>,
): Promise<Awaited<ReturnType<typeof mockTodoistApi>>> {
    await seedLocalStorage(page, { todoist_access_token: TODOIST_TOKEN });
    const handle = await mockTodoistApi(page, scenario);
    await page.goto("/");
    return handle;
}

test.describe("task refresh & display update", () => {
    test("keeps the displayed task while the 2 s display debounce is active", async ({ page }) => {
        const handle = await loadApp(page, makeScenario({ tasks: [alphaTask] }));
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await page.waitForTimeout(1200); // let the initial "Todoist data updated!" toast expire

        handle.setTasks([betaTask]);
        await page.keyboard.press("r");
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeVisible();
        // The data arrived, but the debounce suppresses the re-computation.
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Beta due task" })).toBeHidden();

        await page.waitForTimeout(2500); // let the display debounce expire
        await page.keyboard.press("r");
        // After the window, the changed first-due task surfaces as a toast; click adopts it.
        await page.getByRole("button", { name: "New first-due task! Click to update..." }).click();
        await expect(page.getByRole("heading", { name: "Beta due task" })).toBeVisible();
    });

    test("shows a new-first-due-task toast when the first due task changes", async ({ page }) => {
        const handle = await loadApp(page, makeScenario({ tasks: [alphaTask] }));
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await page.waitForTimeout(2300); // let the display debounce expire

        handle.setTasks([betaTask]);
        await page.keyboard.press("r");

        const toast = page.getByRole("button", { name: "New first-due task! Click to update..." });
        await expect(toast).toBeVisible();
        await expect(page.getByRole("heading", { name: "Beta due task" })).toBeHidden();
        await toast.click();
        await expect(page.getByRole("heading", { name: "Beta due task" })).toBeVisible();
    });

    test("keeps the displayed task and shows an error toast when a refresh fails", async ({
        page,
    }) => {
        await loadApp(page, makeScenario({ tasks: [alphaTask] }));
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await failTodoistRoutes(page, { refresh: true });
        await page.keyboard.press("r");

        await expect(page.getByRole("button", { name: /HTTP 500/ })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });

    test("shows NoTasks and an error toast when the initial refresh fails", async ({ page }) => {
        await seedLocalStorage(page, { todoist_access_token: TODOIST_TOKEN });
        await mockTodoistApi(page, makeScenario({ tasks: [alphaTask] }));
        await failTodoistRoutes(page, { refresh: true });
        await page.goto("/");

        await expect(page.getByText("No due tasks...")).toBeVisible();
        await expect(page.getByRole("button", { name: /HTTP 500/ })).toBeVisible();
    });
});
