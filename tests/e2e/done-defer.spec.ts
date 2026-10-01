import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { failTodoistRoutes } from "./mock-failures";
import { loadApp } from "./helpers";
import { dueObject, makeTask } from "./mock-data";
import { makeScenario } from "./scenarios";

const pad = (value: number): string => String(value).padStart(2, "0");

test.describe("done & defer", () => {
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

    test("marking a recurring task done re-defers it to today and closes it", async ({ page }) => {
        // The task is a recurring task due earlier today (past, so it is due but
        // not overdue, which leaves its due string untouched by the auto-defer).
        // The minutes are chosen relative to now so the due time is in the past
        // at any wall-clock hour (e.g. right after midnight, "now - 30 min"
        // would land on yesterday and be treated as overdue).
        const now = DateTime.now();
        const minutesNow = now.hour * 60 + now.minute;
        const minutesAgo = Math.max(0, Math.min(minutesNow - 30, minutesNow - 1));
        const due = now
            .set({ hour: Math.floor(minutesAgo / 60), minute: minutesAgo % 60, second: 0 })
            .set({ millisecond: 0 });
        const hour12 = ((due.hour + 11) % 12) + 1;
        const meridiem = due.hour < 12 ? "am" : "pm";
        const dueString = `every day at ${hour12}:${pad(due.minute)}${meridiem}`;
        const today = DateTime.now().toISODate();

        const scenario = makeScenario({
            tasks: [
                makeTask("recurring-task", "Recurring task", {
                    priority: 4,
                    due: {
                        ...dueObject(due.toJSDate()),
                        string: dueString,
                        is_recurring: true,
                    },
                }),
                makeTask("recurring-next", "Recurring next task", {
                    due: dueObject(new Date(Date.now() - 2 * 60 * 60 * 1000)),
                }),
            ],
        });

        const handle = await loadApp(page, scenario);
        await expect(page.getByRole("heading", { name: "Recurring task" })).toBeVisible();
        await page.waitForTimeout(2300); // let the display debounce expire

        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.getByRole("button", { name: "CTRL+Enter" }).click();
        await expect(page.getByRole("button", { name: "Task marked done." })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Recurring next task" })).toBeVisible();

        // Done on a recurring task first re-defers it to today (keeping the time
        // from its due string), then closes it in Todoist.
        const updates = handle.updates().filter((entry) => entry.id === "recurring-task");
        expect(updates.length).toBeGreaterThanOrEqual(1);
        const last = updates[updates.length - 1];
        expect(last.body.due_string).toBe(dueString);
        if (due.hour === 0 && due.minute === 0) {
            expect(last.body.due_date).toBe(today); // midnight defers are all-day
        } else {
            expect(last.body.due_datetime).toBe(`${today}T${pad(due.hour)}:${pad(due.minute)}:00`);
        }
        expect(handle.closes()).toContain("recurring-task");
    });

    test("marking done fails: error toast, displayed task unchanged", async ({ page }) => {
        await loadApp(page, makeScenario());
        await failTodoistRoutes(page, { done: ["task-alpha"] });
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.getByRole("button", { name: "CTRL+Enter" }).click();

        await expect(page.getByRole("button", { name: "Failed to mark task done." })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });

    test("deferring fails: error toast, displayed task unchanged", async ({ page }) => {
        await loadApp(page, makeScenario());
        await failTodoistRoutes(page, { defer: ["task-alpha"] });
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await page.keyboard.press("d");
        await page
            .locator("#defer_modal")
            .getByRole("button", { name: /tomorrow/ })
            .click();

        await expect(page.getByRole("button", { name: "Failed to defer task." })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
    });
});
