import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { atHour, loadApp, openAgenda } from "./helpers";
import { dueObject, makeRoutineTask, makeTask, makeTimedTask } from "./mock-data";
import { makeScenario } from "./scenarios";

test.describe("agenda header", () => {
    test("agenda header splits the day's tasks from routines", async ({ page }) => {
        const tasks = [
            makeTimedTask("task-a", "Timed task A", atHour(0, 9)),
            makeTimedTask("task-b", "Timed task B", atHour(0, 10)),
            makeRoutineTask("task-routine", "Routine task", "every day"),
        ];
        await loadApp(page, makeScenario({ tasks }));

        await openAgenda(page, "#today");
        // The header's plaintext title splits the day's tasks from routines.
        await expect(page.locator("#agenda h2")).toHaveAttribute("title", "2 tasks, 1 routines");
    });

    test("agenda header warns about tasks left over from today (tomorrow view)", async ({
        page,
    }) => {
        const tasks = [
            // Tomorrow: one timed task + one routine (the day's total).
            makeTimedTask("task-tm", "Tomorrow timed task", atHour(1, 12)),
            makeRoutineTask("task-tm-routine", "Tomorrow routine task", "every day", {
                due: {
                    ...dueObject(atHour(1, 12), true),
                    string: "every day",
                    is_recurring: true,
                },
            }),
            // Today: three tasks that show up as "left over" in the tomorrow view.
            makeTimedTask("task-t1", "Today task one", atHour(0, 8)),
            makeTimedTask("task-t2", "Today task two", atHour(0, 9)),
            makeTimedTask("task-t3", "Today task three", atHour(0, 10)),
        ];
        await loadApp(page, makeScenario({ tasks }));

        await openAgenda(page, "#tomorrow");
        // The leftover count is joined to the split with a literal newline.
        await expect(page.locator("#agenda h2")).toHaveAttribute(
            "title",
            /1 tasks, 1 routines,\n3 tasks left over from today/,
        );
    });

    test("the stats button in the agenda header opens the stats view", async ({ page }) => {
        await loadApp(page, makeScenario());
        await openAgenda(page, "#today");
        await page.locator("#agenda").getByRole("button", { name: "Stats" }).click();
        await expect(page).toHaveURL(/#stats$/);
        await expect(page.locator("#stats")).toBeVisible();
    });

    test("deferring tomorrow to today moves all of tomorrow's tasks to today", async ({ page }) => {
        const tasks = [
            makeTimedTask("task-tt", "Tomorrow timed task", atHour(1, 9)),
            makeTask("task-ta", "Tomorrow all-day task", { due: dueObject(atHour(1, 0), true) }),
            makeRoutineTask("task-tr", "Tomorrow routine task", "every day at 5pm", {
                due: {
                    ...dueObject(atHour(1, 17)),
                    string: "every day at 5pm",
                    is_recurring: true,
                },
            }),
        ];
        const handle = await loadApp(page, makeScenario({ tasks }));
        await openAgenda(page, "#tomorrow");

        await page
            .locator("#agenda")
            .getByRole("button", { name: "Defer all of tomorrow's tasks to today" })
            .click();
        await expect(
            page.getByRole("button", { name: "Tomorrow's tasks deferred to today." }),
        ).toBeVisible();

        // Wire-level: every task is due today, timed tasks keep their time.
        const today = DateTime.now().toISODate();
        const updates = handle.updates();
        expect(updates.find((entry) => entry.id === "task-tt")?.body.due_datetime).toBe(
            `${today}T09:00:00`,
        );
        const allDay = updates.find((entry) => entry.id === "task-ta")?.body;
        expect(allDay?.due_date).toBe(today);
        expect(allDay?.due_datetime).toBeUndefined();
        expect(updates.find((entry) => entry.id === "task-tr")?.body.due_datetime).toBe(
            `${today}T17:00:00`,
        );

        // Nothing is due tomorrow anymore.
        await expect(page.locator("#agenda h2")).toHaveAttribute("title", "0 tasks");

        // The tasks now live in the today view, and the button is gone there.
        await openAgenda(page, "#today");
        await expect(
            page.locator("#agenda .agenda-task").filter({ hasText: "Tomorrow timed task" }),
        ).toBeVisible();
        await expect(
            page.locator("#agenda .agenda-task").filter({ hasText: "Tomorrow all-day task" }),
        ).toBeVisible();
        await expect(
            page.locator("#agenda .agenda-task").filter({ hasText: "Tomorrow routine task" }),
        ).toBeVisible();
        await expect(
            page
                .locator("#agenda")
                .getByRole("button", { name: "Defer all of tomorrow's tasks to today" }),
        ).toBeHidden();
    });
});
