import { expect, test } from "@playwright/test";
import { DateTime } from "luxon";
import { loadDynalist } from "./helpers";
import {
    makeCountDynalistDocument,
    makeCrossOffDynalistDocument,
    makeTrackingDynalistDocument,
} from "./mock-dynalist";

test.describe("dynalist widgets", () => {
    test("count widget writes the updated count note", async ({ page }) => {
        const handle = await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-count",
            makeCountDynalistDocument(),
        );

        await expect(page.getByText("Water bottles")).toBeVisible();
        const current = page.locator(".comment-item span.text-2xl");
        await expect(current).toHaveText("10");

        await page.getByRole("button", { name: "+1", exact: true }).click();
        await expect(page.getByRole("button", { name: "Updated count!" })).toBeVisible();
        await expect(current).toHaveText("11");
        await page.getByRole("button", { name: "+5", exact: true }).click();
        await expect(current).toHaveText("16");

        const today = new Date().toLocaleDateString("en-CA");
        expect(handle.edits()).toEqual([
            [{ action: "edit", node_id: "root", note: `count 20/11 ${today}` }],
            [{ action: "edit", node_id: "root", note: `count 20/16 ${today}` }],
        ]);
    });

    test("cross-off checks the item in Dynalist and removes it from the local list", async ({
        page,
    }) => {
        const handle = await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-crossoff",
            makeCrossOffDynalistDocument(),
        );

        await expect(page.getByText("3 remaining")).toBeVisible();
        await expect(page.getByText("Oat milk")).toBeVisible();
        await page.locator(".comment-item button").first().click();

        await expect(
            page.getByRole("button", { name: "Removed from list in Dynalist!" }),
        ).toBeVisible();
        await expect(page.getByText("2 remaining")).toBeVisible();
        await expect(page.getByText("Coffee beans")).toBeVisible();
        expect(handle.edits()).toEqual([[{ action: "edit", node_id: "c1", checked: true }]]);
    });

    test("tracking adds and removes today's date, shown in the calendar modal", async ({
        page,
    }) => {
        const handle = await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-tracking",
            makeTrackingDynalistDocument(),
        );

        // exact: the (closed) history modal's header also contains the name
        await expect(page.getByText("Workout habit", { exact: true })).toBeVisible();
        const trackButton = page.locator(".min-h-8 button").first();
        const calendarButton = page.locator(".min-h-8 button").nth(1);
        const todayDots = page.locator("#calendar_modal_root div.bg-red-950 .dot-container");

        await trackButton.click();
        await expect(page.getByRole("button", { name: "Added date to Dynalist!" })).toBeVisible();
        expect(handle.edits()).toEqual([
            [
                {
                    action: "insert",
                    parent_id: "root",
                    index: 0,
                    content: DateTime.now().toISODate(),
                },
            ],
        ]);

        // The modal calendar shows the tracked date as a dot on today's cell
        // (the previously tracked date can sit in the previous month's grid).
        await calendarButton.click();
        await expect(page.locator("#calendar_modal_root")).toBeVisible();
        await expect(todayDots).toHaveCount(1);
        await page.keyboard.press("Escape"); // close the native dialog

        await trackButton.click();
        await expect(
            page.getByRole("button", { name: "Removed date from Dynalist!" }),
        ).toBeVisible();
        // The mock answers the insert with this node id; the delete targets it.
        expect(handle.edits()[1]).toEqual([{ action: "delete", node_id: "e2e-node-1-1" }]);

        await calendarButton.click();
        await expect(todayDots).toHaveCount(0);
    });
});
