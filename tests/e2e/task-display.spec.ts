import { expect, test, type Page } from "@playwright/test";
import { DateTime } from "luxon";
import { loadApp } from "./helpers";
import { dueObject, makeOverdueTask, makeProject, makeTask } from "./mock-data";
import { makeScenario } from "./scenarios";

const HOUR = 60 * 60 * 1000;

/**
 * Marks the displayed task done (via its kbd label) and waits for the next
 * one to display, then lets the display debounce expire.
 * @param {Page} page - The browser page.
 * @param {string} title - The heading expected to display next.
 */
async function advanceTo(page: Page, title: string): Promise<void> {
    await page.getByRole("button", { name: "CTRL+Enter" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await page.waitForTimeout(2300);
}

test.describe("task display & ordering", () => {
    test("sorts due tasks by context, then priority, then due date", async ({ page }) => {
        const now = Date.now();
        const scenario = makeScenario({
            projects: [
                makeProject("e2e-ctx-a", "Context A", 1),
                makeProject("e2e-ctx-b", "Context B", 2),
            ],
            tasks: [
                makeTask("sort-a4", "Priority four task", {
                    project_id: "e2e-ctx-a",
                    priority: 4,
                    due: dueObject(new Date(now - HOUR)),
                }),
                makeTask("sort-a1", "Priority one task", {
                    project_id: "e2e-ctx-a",
                    priority: 1,
                    due: dueObject(new Date(now - 5 * HOUR)),
                }),
                makeTask("sort-b-early", "Due earlier task", {
                    project_id: "e2e-ctx-b",
                    priority: 2,
                    due: dueObject(new Date(now - 4 * HOUR)),
                }),
                makeTask("sort-b-late", "Due later task", {
                    project_id: "e2e-ctx-b",
                    priority: 2,
                    due: dueObject(new Date(now - 2 * HOUR)),
                }),
                makeTask("sort-noc", "No context task", {
                    // Empty project id: the SDK schema requires a string, and the
                    // app sorts a falsy contextId ("no context") before any context.
                    project_id: "",
                    priority: 1,
                    due: dueObject(new Date(now - 9 * HOUR)),
                }),
            ],
        });

        // Context order comes first (no-context tasks before any context,
        // Context A before Context B even against higher priorities there),
        // then priority (four before one despite the later due date), then
        // due date (earlier before later at the same context and priority).
        await loadApp(page, scenario);
        await expect(page.getByRole("heading", { name: "No context task" })).toBeVisible();
        await page.waitForTimeout(2300); // let the display debounce expire
        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await advanceTo(page, "Priority four task");
        await advanceTo(page, "Priority one task");
        await advanceTo(page, "Due earlier task");
        await advanceTo(page, "Due later task");
    });

    test("auto-defers overdue tasks to today on refresh", async ({ page }) => {
        const today = DateTime.now().toISODate();
        const scenario = makeScenario({
            tasks: [
                makeOverdueTask("overdue-allday", "Overdue all-day task"),
                makeTask("overdue-timed", "Overdue timed task", {
                    due: {
                        ...dueObject(
                            DateTime.now()
                                .minus({ days: 1 })
                                .set({ hour: 9, minute: 0, second: 0, millisecond: 0 })
                                .toJSDate(),
                        ),
                        string: "at 9am",
                    },
                }),
            ],
        });

        const handle = await loadApp(page, scenario);
        // The success toast fires only after the overdue defers have been sent.
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeVisible();
        const recorded = handle.updates();
        // All-day tasks are deferred to midnight; a time in the due string is kept.
        expect(recorded.find((entry) => entry.id === "overdue-allday")?.body.due_date).toBe(today);
        expect(recorded.find((entry) => entry.id === "overdue-timed")?.body.due_datetime).toBe(
            `${today}T09:00:00`,
        );
        await expect(page.getByRole("heading", { name: "Overdue all-day task" })).toBeVisible();

        // The mock applied the defers, so a new refresh must not defer again.
        const deferredCount = handle.updates().length;
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeHidden();
        await page.keyboard.press("r");
        await expect(page.getByRole("button", { name: "Todoist data updated!" })).toBeVisible();
        expect(handle.updates().length).toBe(deferredCount);
    });

    test("shows NoTasks when nothing is due", async ({ page }) => {
        const scenario = makeScenario({
            tasks: [
                makeTask("task-future", "Future task", {
                    due: dueObject(new Date(Date.now() + 48 * HOUR)),
                }),
                makeTask("task-nodate", "No date task"),
            ],
        });
        await loadApp(page, scenario);

        await expect(page.getByText("No due tasks...")).toBeVisible();
    });

    test("shows NoTasks when the account has zero tasks", async ({ page }) => {
        await loadApp(page, makeScenario({ tasks: [] }));
        await expect(page.getByText("No due tasks...")).toBeVisible();
        await expect(page.getByRole("button", { name: /Today/ })).toBeVisible();
        // The empty task list is truthy, so AppView never reaches the
        // "No tasks, try adding some" placeholder.
        await expect(page.getByText("No tasks, try adding some")).toHaveCount(0);
    });
});
