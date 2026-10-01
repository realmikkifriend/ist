import { expect, test } from "@playwright/test";
import { loadApp, loadDynalist } from "./helpers";
import {
    makeChecklistDynalistDocument,
    makeDynalistDocument,
    makeDynalistNode,
    mockDynalistTokenValidation,
} from "./mock-dynalist";
import { makeScenario } from "./scenarios";

test.describe("dynalist", () => {
    test("dynalist URL in a comment renders an interactive checklist", async ({ page }) => {
        await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-dynalist#z=root",
            makeChecklistDynalistDocument(),
        );

        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await expect(page.getByText("First item")).toBeVisible();
        await page.getByRole("button", { name: "Next item" }).click();
        await expect(page.getByText("Second item")).toBeVisible();
    });

    test("auth request with a valid token stores it and renders the document", async ({ page }) => {
        // No Dynalist token stored: the comment shows the auth request form.
        await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-dynalist#z=root",
            makeChecklistDynalistDocument(),
            false,
        );
        await mockDynalistTokenValidation(page, true);

        await expect(
            page.getByText("Dynalist URL detected but no access code stored."),
        ).toBeVisible();
        await page.getByPlaceholder("Enter your token").fill("e2eValidToken");
        await page.keyboard.press("Enter");

        await expect(
            page.getByRole("button", { name: "Dynalist access token set!" }),
        ).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem("dynalist_access_token"))).toBe(
            JSON.stringify("e2eValidToken"),
        );
        // The comment re-renders with the interactive Dynalist content.
        await expect(page.getByRole("button", { name: "Next item" })).toBeVisible();
    });

    test("auth request with an invalid token shows an inline error", async ({ page }) => {
        await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-dynalist#z=root",
            makeChecklistDynalistDocument(),
            false,
        );
        await mockDynalistTokenValidation(page, false);

        await expect(
            page.getByText("Dynalist URL detected but no access code stored."),
        ).toBeVisible();
        await page.getByPlaceholder("Enter your token").fill("e2eBadToken");
        await page.keyboard.press("Enter");

        await expect(page.getByText("Invalid token")).toBeVisible();
        expect(await page.evaluate(() => localStorage.getItem("dynalist_access_token"))).toBeNull();
        // The auth form stays on screen for another attempt.
        await expect(page.getByPlaceholder("Enter your token")).toBeVisible();
    });

    test("type menu switches the rendered view", async ({ page }) => {
        await loadDynalist(
            page,
            "https://dynalist.io/d/e2e-type",
            makeDynalistDocument("e2e-type", [
                makeDynalistNode("root", "Notes", { children: ["n1", "n2"], note: "read" }),
                makeDynalistNode("n1", "A read note item"),
                makeDynalistNode("n2", "Another read note item"),
            ]),
        );

        // The document's note is "read", so it renders as markdown by default.
        await expect(page.getByText("A read note item")).toBeVisible();
        // daisyUI 5 opens the default dropdown variant on focus, not hover.
        await page.locator(".comment-item .dropdown > [role='button']").click();
        await page.getByRole("button", { name: "Checklist" }).click();
        await expect(page.getByRole("button", { name: "Next item" })).toBeVisible();
    });

    test("the z key cycles focus across the comment focus targets", async ({ page }) => {
        const comment = (id: string, content: string): Record<string, unknown> => ({
            id,
            item_id: "task-alpha",
            content,
            posted_at: new Date().toISOString(),
            file_attachment: null,
            posted_uid: "17324928",
            uids_to_notify: null,
            reactions: null,
            is_deleted: false,
        });
        const scenario = makeScenario({
            comments: {
                "task-alpha": [
                    comment("comment-one", "First plain comment"),
                    comment("comment-two", "Second plain comment"),
                ],
            },
        });
        await loadApp(page, scenario);
        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();

        const items = page.locator(".comment-item");
        await expect(items).toHaveCount(2);
        await page.keyboard.press("z");
        await expect(items.nth(0)).toBeFocused();
        await page.keyboard.press("z");
        await expect(items.nth(1)).toBeFocused();
        // Wraps around to the first target.
        await page.keyboard.press("z");
        await expect(items.nth(0)).toBeFocused();
    });
});
