import { expect, test } from "@playwright/test";
import { DYNALIST_TOKEN, TODOIST_TOKEN } from "./helpers";
import { mockDynalistDocument } from "./mock-dynalist";
import { mockTodoistApi } from "./mock";
import { seedLocalStorage } from "./seed";
import { makeScenario } from "./scenarios";

test.describe("dynalist", () => {
    test("dynalist URL in a comment renders an interactive checklist", async ({ page }) => {
        const scenario = makeScenario({
            comments: {
                "task-alpha": [
                    {
                        id: "comment-dynalist",
                        item_id: "task-alpha",
                        content: "https://dynalist.io/d/e2e-dynalist#z=root",
                        posted_at: new Date().toISOString(),
                        file_attachment: null,
                        posted_uid: "17324928",
                        uids_to_notify: null,
                        reactions: null,
                        is_deleted: false,
                    },
                ],
            },
        });

        await seedLocalStorage(page, {
            todoist_access_token: TODOIST_TOKEN,
            dynalist_access_token: DYNALIST_TOKEN,
        });
        await mockTodoistApi(page, scenario);
        await mockDynalistDocument(page, {
            file_id: "e2e-dynalist",
            nodes: [
                {
                    id: "root",
                    content: "Daily checklist",
                    children: ["n1", "n2", "n3"],
                    note: "checklist",
                },
                { id: "n1", content: "First item" },
                { id: "n2", content: "Second item" },
                { id: "n3", content: "Third item" },
            ],
        });
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "Alpha due task" })).toBeVisible();
        await expect(page.getByText("First item")).toBeVisible();

        await page.getByRole("button", { name: "Next item" }).click();
        await expect(page.getByText("Second item")).toBeVisible();
    });
});
