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
        // The task is due yesterday at (now - 30 min), so the startup
        // auto-defer puts it on today; done must re-defer it to the same
        // time today first, then close it in Todoist.
        const dueBase = new Date(Date.now() - 30 * 60 * 1000);
        dueBase.setSeconds(0, 0);
        const hour12 = (dueBase.getHours() + 11) % 12 + 1;
        const meridiem = dueBase.getHours() < 12 ? "am" : "pm";
        const dueString = `every day at ${hour12}:${pad(dueBase.getMinutes())}${meridiem}`;
        const today = DateTime.now().toISODate();

        const scenario = makeScenario({
            tasks: [
                makeTask("recurring-task", "Recurring task", {
                    priority: 4,
                    due: {
                        ...dueObject(
                            DateTime.now()
                                .minus({ days: 1, minutes: 30 })
                                .set({ second: 0, millisecond: 0 })
                                .toJSDate(),
                        ),
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

        const updates = handle.updates().filter((entry) => entry.id === "recurring-task");
        expect(updates.length).toBeGreaterThanOrEqual(2); // startup auto-defer + done re-defer
        const last = updates[updates.length - 1];
        expect(last.body.due_string).toBe(dueString);
        if (dueBase.getHours() === 0 && dueBase.getMinutes() === 0) {
            // Midnight defers serialize as an all-day due_date.
            expect(last.body.due_date).toBe(today);
        } else {
            expect(last.body.due_datetime).toBe(
                `${today}T${pad(dueBase.getHours())}:${pad(dueBase.getMinutes())}:00`,
            );
        }
        expect(handle.closes()).toContain("recurring-task");
    });
});
