import { expect, test } from "@playwright/test";
import { loadApp } from "./helpers";
import { dueObject, E2E_CONTEXTS, makeProject, makeTask } from "./mock-data";
import { makeMultiContextScenario, makeScenario } from "./scenarios";

const MINUTE = 60 * 1000;

test.describe("contexts", () => {
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

    test("auto-unselects a selected context when it has no due tasks left", async ({ page }) => {
        const handle = await loadApp(page, makeScenario(makeMultiContextScenario()));
        await expect(page.getByRole("heading", { name: "Inbox due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page
            .locator(".menu")
            .getByRole("button", { name: /Reading/ })
            .click();
        await expect(page.getByRole("heading", { name: "Reading due task" })).toBeVisible();

        // Let the display debounce expire so the re-evaluation below is not suppressed.
        await page.waitForTimeout(2300);

        // Marking the context's last due task done closes it, refreshes, and
        // re-evaluates: the re-evaluation finds no due tasks left in the
        // selected context and auto-clears the selection.
        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.getByRole("button", { name: "CTRL+Enter" }).click();
        await expect(page.getByRole("button", { name: "Task marked done." })).toBeVisible();
        expect(handle.closes()).toContain("task-reading");

        await expect
            .poll(() =>
                page.evaluate(
                    () =>
                        (
                            JSON.parse(localStorage.getItem("user_settings") ?? "{}") as {
                                selectedContext: { id: string; name: string } | null;
                            }
                        ).selectedContext,
                ),
            )
            .toBeNull();
        await expect(page.getByRole("heading", { name: "Inbox due task" })).toBeVisible();
    });

    test("drag reordering contexts syncs the new order and re-evaluates the task", async ({
        page,
    }) => {
        const projects = [
            makeProject(E2E_CONTEXTS.reading, "Reading", 1),
            makeProject(E2E_CONTEXTS.gardening, "Gardening", 2),
        ];
        // Reading has the higher context order, so its task displays first; after the
        // reorder, the Gardening task becomes the first-due task (on the next refresh).
        const readingTask = makeTask("task-reading", "Reading due task", {
            project_id: E2E_CONTEXTS.reading,
            priority: 2,
            due: dueObject(new Date(Date.now() - 90 * MINUTE)),
        });
        const gardeningTask = makeTask("task-gardening", "Gardening due task", {
            project_id: E2E_CONTEXTS.gardening,
            priority: 1,
            due: dueObject(new Date(Date.now() - 30 * MINUTE)),
        });
        const handle = await loadApp(
            page,
            makeScenario({ projects, tasks: [readingTask, gardeningTask] }),
        );
        await expect(page.getByRole("heading", { name: "Reading due task" })).toBeVisible();

        // Let the display debounce expire so the re-evaluation after the drag is not suppressed.
        await page.waitForTimeout(2300);
        await page.locator(".drawer-content .drawer-button").click();
        await page
            .locator(".menu")
            .getByRole("button", { name: /Reading/ })
            .dragTo(page.locator(".menu").getByRole("button", { name: /Gardening/ }), {
                steps: 10,
            });

        await expect(
            page.getByRole("button", { name: "Contexts reordered successfully!" }),
        ).toBeVisible();
        const command = (
            handle.syncs()[0]?.commands as Array<Record<string, unknown>> | undefined
        )?.[0];
        // The SDK sends the reorder as a snake_case sync command.
        expect(command?.type).toBe("project_reorder");
        expect((command?.args as Record<string, unknown>)?.projects).toEqual([
            { id: E2E_CONTEXTS.gardening, child_order: 1 },
            { id: E2E_CONTEXTS.reading, child_order: 2 },
        ]);
        // The post-drag re-evaluation picks from the pre-drag sort, so the display keeps
        // the Reading task until the next refresh re-sorts under the new context order.
        await expect(page.getByRole("heading", { name: "Reading due task" })).toBeVisible();

        await page.waitForTimeout(2500); // let the display debounce set by the re-evaluation expire
        await page.keyboard.press("r");
        await page.getByRole("button", { name: "New first-due task! Click to update..." }).click();
        await expect(page.getByRole("heading", { name: "Gardening due task" })).toBeVisible();
    });

    test("task search finds non-due tasks and summons the pick", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.locator(".drawer-content .drawer-button").click();
        await page.keyboard.press("/");
        const input = page.locator("#task_search_modal_input");
        await input.fill("delta");
        await expect(
            page.locator("#task_search_modal").getByText("Delta tomorrow task"),
        ).toBeVisible();
        await input.press("Enter");

        await expect(page.getByRole("heading", { name: "Delta tomorrow task" })).toBeVisible();
        await expect(input).toBeHidden();

        // A term that matches nothing shows the "No results..." state.
        await page.locator(".drawer-content .drawer-button").click();
        await page.keyboard.press("/");
        await input.fill("zzz");
        await expect(page.locator("#task_search_modal").getByText("No results...")).toBeVisible();
    });
});
