import { expect, test } from "@playwright/test";
import { loadApp, loadDynalist, TODOIST_TOKEN } from "./helpers";
import { failTodoistRoutes } from "./mock-failures";
import { makeChecklistDynalistDocument } from "./mock-dynalist";
import { dueObject, makeTask } from "./mock-data";
import { mockTodoistApi } from "./mock";
import { seedLocalStorage } from "./seed";
import { makeScenario } from "./scenarios";

const MINUTE = 60 * 1000;
const alphaTask = makeTask("task-alpha", "Alpha due task", {
    due: dueObject(new Date(Date.now() - 90 * MINUTE)),
});
const betaTask = makeTask("task-beta", "Beta due task", {
    due: dueObject(new Date(Date.now() - 45 * MINUTE)),
});

test.describe("task refresh & display update", () => {
    test("keeps the displayed task while the 2 s display debounce is active", async ({ page }) => {
        const handle = await loadApp(page, makeScenario({ tasks: [alphaTask] }));
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        // Let the initial "Todoist data updated!" toast expire (incl. its exit
        // animation) so only the refresh toast is in the DOM when we assert on it.
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeHidden({
            timeout: 10000,
        });

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

    test("keeps an unchanged displayed task's Dynalist checklist without refetching", async ({
        page,
    }) => {
        const handle = await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-dynalist#z=root",
            makeChecklistDynalistDocument(),
        );
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await expect(page.getByText("First item")).toBeVisible();
        expect(handle.reads()).toBe(1);

        // Let the 2 s display debounce expire so the refresh recomputes the display.
        await page.waitForTimeout(2500);
        await page.keyboard.press("r");
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeVisible();

        // Give any (incorrect) re-enrichment chain a moment to land its doc/read.
        await page.waitForTimeout(1000);
        // The first-due task is unchanged, so the Dynalist document is not refetched.
        expect(handle.reads()).toBe(1);
        await expect(page.getByText("First item")).toBeVisible();
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
