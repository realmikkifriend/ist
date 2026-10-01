import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { failTodoistRoutes } from "./mock-failures";
import { dueEarlierToday, loadApp } from "./helpers";
import { dueObject, makeTask } from "./mock-data";
import { makeScenario } from "./scenarios";

/**
 * Returns the index of the given local date's day button in the defer modal's
 * calendar grid (buttons cover the displayed month, then the next month's
 * trailing days; the month's leading days are rendered without buttons).
 * @param {DateTime} target - The local date whose day button to locate.
 * @returns {number} Zero-based button index within the day grid.
 */
function dayButtonIndex(target: DateTime): number {
    const now = DateTime.now();
    return target.hasSame(now, "month")
        ? target.day - 1
        : now.startOf("month").daysInMonth + target.day - 1;
}

test.describe("defer modal", () => {
    test("timed tasks start on the time tab; number keys and arrow keys work", async ({ page }) => {
        // The due string defines a time (the app derives the all-day flag from
        // the string, not the date), so the time tab is active initially.
        const task = makeTask("timed-task", "Timed defer task", {
            due: { ...dueObject(dueEarlierToday().toJSDate()), string: "at 9:30am" },
        });
        const handle = await loadApp(page, makeScenario({ tasks: [task] }));
        await expect(page.getByRole("heading", { name: "Timed defer task" })).toBeVisible();

        // Reveal the keyboard shortcut labels so the tabs are identified by them.
        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.keyboard.press("d");
        await expect(page.locator("#defer_modal")).toBeVisible();

        const timeTab = page.getByRole("tab", { name: "←" });
        const calendarTab = page.getByRole("tab", { name: "→" });
        await expect(timeTab).toHaveClass(/tab-active/);
        // The time tab offers quick options, with "tomorrow" keeping the due time.
        await expect(
            page.locator("#defer_modal").getByRole("button", { name: /tomorrow 9:30 AM/ }),
        ).toBeVisible();

        await page.keyboard.press("ArrowRight");
        await expect(calendarTab).toHaveClass(/tab-active/);
        await expect(page.locator("#defer_modal .grid-cols-7")).toBeVisible();
        await page.keyboard.press("ArrowLeft");
        await expect(timeTab).toHaveClass(/tab-active/);

        // Number key 1 picks the first quick option ("tomorrow", due time kept).
        await page.keyboard.press("1");
        await expect(
            page.getByRole("button", { name: "Task deferred successfully." }),
        ).toBeVisible();
        const target = DateTime.now().plus({ days: 1 });
        const updates = handle.updates().filter((entry) => entry.id === "timed-task");
        expect(updates.length).toBe(1);
        expect(updates[0].body.due_datetime).toBe(`${target.toISODate()}T09:30:00`);
    });

    test("all-day tasks start on the calendar tab", async ({ page }) => {
        // An all-day due (date only, no time in the due string) starts on the
        // calendar tab.
        const task = makeTask("all-day-task", "All day task", {
            due: dueObject(new Date(), true),
        });
        await loadApp(page, makeScenario({ tasks: [task] }));
        await expect(page.getByRole("heading", { name: "All day task" })).toBeVisible();

        await page.evaluate(() => document.body.classList.add("show-kbd"));
        await page.keyboard.press("d");
        await expect(page.locator("#defer_modal")).toBeVisible();
        await expect(page.getByRole("tab", { name: "→" })).toHaveClass(/tab-active/);
        await expect(page.locator("#defer_modal .grid-cols-7")).toBeVisible();
    });

    test("calendar tab: deferring to a specific date keeps the time of day", async ({ page }) => {
        const dueString = "at 9:30am";
        const task = makeTask("preserve-time-task", "Preserve time task", {
            due: { ...dueObject(dueEarlierToday().toJSDate()), string: dueString },
        });
        const handle = await loadApp(page, makeScenario({ tasks: [task] }));
        await expect(page.getByRole("heading", { name: "Preserve time task" })).toBeVisible();

        await page.keyboard.press("d");
        await expect(page.locator("#defer_modal")).toBeVisible();
        await page.keyboard.press("ArrowRight");

        const target = DateTime.now().plus({ days: 3 });
        await page.locator("#defer_modal .grid-cols-7 button").nth(dayButtonIndex(target)).click();

        await expect(
            page.getByRole("button", { name: "Task deferred successfully." }),
        ).toBeVisible();
        // The defer keeps the time extracted from the due string on the picked date.
        const updates = handle.updates().filter((entry) => entry.id === "preserve-time-task");
        expect(updates.length).toBe(1);
        expect(updates[0].body.due_datetime).toBe(`${target.toISODate()}T09:30:00`);
        expect(updates[0].body.due_string).toBe(dueString);
    });

    test("calendar tab: deferring an all-day task to a specific date defers without a time", async ({
        page,
    }) => {
        const task = makeTask("all-day-defer", "All day defer task", {
            due: dueObject(new Date(), true),
        });
        const handle = await loadApp(page, makeScenario({ tasks: [task] }));
        await expect(page.getByRole("heading", { name: "All day defer task" })).toBeVisible();

        await page.keyboard.press("d");
        await expect(page.locator("#defer_modal")).toBeVisible();

        const target = DateTime.now().plus({ days: 3 });
        await page.locator("#defer_modal .grid-cols-7 button").nth(dayButtonIndex(target)).click();

        // No time of day is defined, so the defer is an all-day date. (The
        // success toast is already asserted by the timed calendar defer test
        // above, so here we only check the sent payload.)
        await expect
            .poll(() => handle.updates().filter((entry) => entry.id === "all-day-defer"))
            .toHaveLength(1);
        const body = handle.updates().filter((entry) => entry.id === "all-day-defer")[0].body;
        expect(body.due_date).toBe(target.toISODate());
        expect(body.due_datetime).toBeUndefined();
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
