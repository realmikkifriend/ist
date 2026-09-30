import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { dueObject, makeTask } from "./mock-data";
import { mockTodoistApi } from "./mock";
import { seedLocalStorage } from "./seed";
import { makeScenario } from "./scenarios";

const TODOIST_TOKEN = "e2e-todoist-token";
const pad = (value: number): string => String(value).padStart(2, "0");

test.describe("recurring tasks", () => {
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

        await seedLocalStorage(page, { todoist_access_token: TODOIST_TOKEN });
        const handle = await mockTodoistApi(page, scenario);
        await page.goto("/");
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
});
