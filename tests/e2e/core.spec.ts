import { expect, test, type Page } from "@playwright/test";
import { mockDynalistDocument } from "./mock-dynalist";
import { dueObject, makeTask } from "./mock-data";
import { mockTodoistApi, seedLocalStorage } from "./mock";
import { makeScenario } from "./scenarios";

const TODOIST_TOKEN = "e2e-todoist-token";
const DYNALIST_TOKEN = "e2e-dynalist-token";

/**
 * Loads the app with a seeded Todoist token and mocked Todoist API routes.
 * @param {Page} page - The browser page to load.
 * @param {ReturnType<typeof makeScenario>} scenario - The mocked API data.
 */
async function loadApp(page: Page, scenario: ReturnType<typeof makeScenario>): Promise<void> {
    await seedLocalStorage(page, { todoist_access_token: TODOIST_TOKEN });
    await mockTodoistApi(page, scenario);
    await page.goto("/");
}

test.describe("core suite", () => {
    test("full login flow displays the first due task", async ({ page }) => {
        await mockTodoistApi(page, makeScenario());
        await page.goto("/");
        const origin = new URL(page.url()).origin;

        await page.route("**/todoist.com/oauth/authorize**", (route) =>
            route.fulfill({
                status: 302,
                headers: { location: `${origin}/?code=e2e-auth-code` },
            }),
        );
        await page.route("**/oauth/access_token", (route) =>
            route.fulfill({ status: 200, json: { access_token: TODOIST_TOKEN } }),
        );

        await expect(page.getByRole("heading", { name: "One Task at a Time" })).toBeVisible();
        await page.getByRole("link", { name: "Continue with Todoist" }).click();

        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });

    test("shows NoTasks when nothing is due", async ({ page }) => {
        const scenario = makeScenario({
            tasks: [
                makeTask("task-future", "Future task", {
                    due: dueObject(new Date(Date.now() + 48 * 60 * 60 * 1000)),
                }),
                makeTask("task-nodate", "No date task"),
            ],
        });
        await loadApp(page, scenario);

        await expect(page.getByText("No due tasks...")).toBeVisible();
    });

    test("context filter turns on and off", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page.locator(".menu").getByRole("button", { name: /Home/ }).click();
        await expect(page.getByRole("heading", { name: "Gamma due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page.locator(".menu").getByRole("button", { name: /Home/ }).click();
        // Deselecting the context surfaces the new-first-due-task toast; confirm it.
        await page.getByRole("button", { name: /New first-due task/ }).click();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });

    test("summoning a task from the agenda closes it and displays the task", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.evaluate(() => {
            window.location.hash = "#tomorrow";
        });
        await expect(page.locator("#agenda")).toBeVisible();

        await page.getByRole("button", { name: "12:00" }).click();

        await expect(page.locator("#agenda")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Delta tomorrow task" })).toBeVisible();
    });

    test("done and defer advance to the next due task", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        // Let the display debounce expire so the task change is not suppressed.
        await page.waitForTimeout(2300);

        // Reveal the keyboard shortcut labels so the action buttons are identified by them.
        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.getByRole("button", { name: "CTRL+Enter" }).click();
        await expect(page.getByRole("button", { name: "Task marked done." })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Beta due task" })).toBeVisible();

        await page.waitForTimeout(2300);

        await page.keyboard.press("d");
        await page
            .locator("#defer_modal")
            .getByRole("button", { name: /tomorrow/ })
            .click();
        await expect(
            page.getByRole("button", { name: "Task deferred successfully." }),
        ).toBeVisible();
        await expect(page.getByRole("heading", { name: "Gamma due task" })).toBeVisible();
    });

    test("dynalist URL in a comment renders an interactive checklist", async ({ page }) => {
        const scenario = makeScenario({
            comments: {
                "task-alpha": [
                    {
                        id: "comment-dynalist",
                        item_id: "task-alpha",
                        content: "https://dynalist.io/d/e2e-dynalist#z=root",
                        posted_at: new Date().toISOString(),
                        file_attachment: null,
                        posted_uid: "17324928",
                        uids_to_notify: null,
                        reactions: null,
                        is_deleted: false,
                    },
                ],
            },
        });

        await seedLocalStorage(page, {
            todoist_access_token: TODOIST_TOKEN,
            dynalist_access_token: DYNALIST_TOKEN,
        });
        await mockTodoistApi(page, scenario);
        await mockDynalistDocument(page, {
            file_id: "e2e-dynalist",
            nodes: [
                {
                    id: "root",
                    content: "Daily checklist",
                    children: ["n1", "n2", "n3"],
                    note: "checklist",
                },
                { id: "n1", content: "First item" },
                { id: "n2", content: "Second item" },
                { id: "n3", content: "Third item" },
            ],
        });
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await expect(page.getByText("First item")).toBeVisible();

        await page.getByRole("button", { name: "Next item" }).click();
        await expect(page.getByText("Second item")).toBeVisible();
    });
});
