import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { atHour, loadApp, openAgenda } from "./helpers";
import { dueObject, makeRoutineTask, makeTask, makeTimedTask } from "./mock-data";
import { makeScenario } from "./scenarios";

test.describe("agenda", () => {
    test("summoning a task from the agenda closes it and displays the task", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openAgenda(page, "#tomorrow");

        await page.getByRole("button", { name: "12:00" }).click();

        await expect(page.locator("#agenda")).toBeHidden();
        await expect(page.getByRole("heading", { name: "Delta tomorrow task" })).toBeVisible();
    });

    test("scheduling from the agenda defers the task to the picked time", async ({ page }) => {
        const handle = await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openAgenda(page, "#tomorrow");

        // Delta is the only task due tomorrow; its chevron opens the ScheduleModal.
        await page.locator("#agenda").getByTitle("Schedule task").first().click();
        const modal = page.locator("#schedule_modal_task-delta");
        await expect(modal).toBeVisible();
        await modal.getByRole("button", { name: "Select 9 AM" }).click();
        await modal.getByRole("button", { name: "9:00 AM" }).click();

        await expect(
            page.getByRole("button", { name: "Task scheduled successfully." }),
        ).toBeVisible();
        const tomorrow = DateTime.now().plus({ days: 1 });
        const updates = handle.updates().filter((entry) => entry.id === "task-delta");
        expect(updates.length).toBe(1);
        expect(updates[0].body.due_datetime).toBe(`${tomorrow.toISODate()}T09:00:00`);
    });

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

    test("the displayed task is highlighted in the agenda", async ({ page }) => {
        await loadApp(page, makeScenario());
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        await openAgenda(page, "#today");

        const alphaRow = page.locator("#agenda .agenda-task").filter({ hasText: "Alpha due task" });
        await expect(alphaRow).toHaveClass(/ring-4 ring-green-500\/60/);

        const betaRow = page.locator("#agenda .agenda-task").filter({ hasText: "Beta due task" });
        await expect(betaRow).not.toHaveClass(/ring-green-500/);
    });

    test("the displayed all-day task is highlighted in the agenda", async ({ page }) => {
        // A single all-day task due today is the first-due (displayed) task and
        // lives in the un-timed list at the top of the agenda.
        const tasks = [
            makeTask("task-allday", "All day task", { due: dueObject(new Date(), true) }),
        ];
        await loadApp(page, makeScenario({ tasks }));
        await expect(page.getByRole("heading", { name: "All day task" })).toBeVisible();

        await openAgenda(page, "#today");

        const row = page.locator("#agenda .agenda-task").filter({ hasText: "All day task" });
        await expect(row).toHaveClass(/ring-4 ring-green-500\/60/);
    });

    test("the a key, NoTasks, and close button switch agenda views", async ({ page }) => {
        // Nothing is due today or tomorrow, so the NoTasks view is shown.
        const tasks = [makeTimedTask("task-future", "Future task", atHour(2, 9))];
        await loadApp(page, makeScenario({ tasks }));
        await expect(page.getByText("No due tasks...")).toBeVisible();

        // Open the agenda from the NoTasks page.
        await page.getByRole("button", { name: /Today/ }).click();
        await expect(page.locator("#agenda")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

        // Close it with the close button (the last button in the agenda header).
        const closeButton = page.locator("#agenda > div").first().getByRole("button").last();
        await closeButton.click();
        await expect(page.locator("#agenda")).toBeHidden();

        // The a key cycles today -> tomorrow -> closed.
        await page.keyboard.press("a");
        await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
        await page.keyboard.press("a");
        await expect(page.getByRole("heading", { name: "Tomorrow" })).toBeVisible();
        await page.keyboard.press("a");
        await expect(page.locator("#agenda")).toBeHidden();
    });

    test("the agenda body lists all-day tasks above the hour grid, with a 4+ overflow", async ({
        page,
    }) => {
        const tasks = [
            makeTask("task-allday", "All day task", { due: dueObject(new Date(), true) }),
            // Four timed tasks in the same hour trigger the overflow indicator.
            makeTimedTask("task-h1", "Hour task one", atHour(0, 9, 5)),
            makeTimedTask("task-h2", "Hour task two", atHour(0, 9, 10)),
            makeTimedTask("task-h3", "Hour task three", atHour(0, 9, 20)),
            makeTimedTask("task-h4", "Hour task four", atHour(0, 9, 30)),
        ];
        await loadApp(page, makeScenario({ tasks }));

        await openAgenda(page, "#today");

        // All-day tasks render in the section above the hour grid.
        await expect(
            page.locator("#agenda .agenda-task").filter({ hasText: "All day task" }),
        ).toBeVisible();
        // An hour with four or more tasks shows the red "4+" overflow indicator.
        await expect(page.locator("#agenda").getByText("4+")).toBeVisible();
    });
});
