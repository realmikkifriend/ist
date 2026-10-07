import type { Page } from "@playwright/test";

const CORS_HEADERS: Record<string, string> = { "access-control-allow-origin": "*" };
const OPTIONS_HEADERS: Record<string, string> = {
    ...CORS_HEADERS,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
};
const DAY = 24 * 60 * 60 * 1000;

const pad = (value: number): string => String(value).padStart(2, "0");

const datePart = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * Builds a Dynalist node in the raw document format.
 * @param {string} id - The node identifier.
 * @param {string} content - The node text.
 * @param {Record<string, unknown>} [overrides] - Fields that override the
 *   defaults (e.g. `note`, `children`, `checked`).
 * @returns {Record<string, unknown>} The raw node.
 */
export function makeDynalistNode(
    id: string,
    content: string,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return { id, content, ...overrides };
}

/**
 * Builds a Dynalist document payload for `mockDynalistDocument`.
 * @param {string} fileId - The document id, matching the file id in the Dynalist `/d/` URL.
 * @param {Record<string, unknown>[]} nodes - All nodes; the rendered root is
 *   the node matching the URL's `#z=` sub-item, or the one with id "root".
 * @returns {Record<string, unknown>} The raw document.
 */
export function makeDynalistDocument(
    fileId: string,
    nodes: Record<string, unknown>[],
): Record<string, unknown> {
    return { file_id: fileId, nodes };
}

/**
 * Builds a Dynalist document that renders as a checklist: the root note is
 * `checklist` and its children are the items, shown one at a time.
 * @param {string} [fileId] - Which Dynalist document this serves.
 * @param {string[]} [items] - The item contents, in order.
 * @returns {Record<string, unknown>} The raw document.
 */
export function makeChecklistDynalistDocument(
    fileId: string = "e2e-dynalist",
    items: string[] = ["First item", "Second item", "Third item"],
): Record<string, unknown> {
    const itemNodes = items.map((item, index) => makeDynalistNode(`n${index + 1}`, item));
    return makeDynalistDocument(fileId, [
        makeDynalistNode("root", "Daily checklist", {
            note: "checklist",
            children: itemNodes.map((node) => node.id),
        }),
        ...itemNodes,
    ]);
}

/**
 * Builds a Dynalist document that renders as a count widget: the root note is
 * a `count` note with today's date so the current count is preserved (a stale
 * date would reset it to 0) and +1/+5/+10 write a new note via `doc/edit`.
 * @param {string} [fileId] - Which Dynalist document this serves.
 * @param {number} [total] - The daily target count.
 * @param {number} [current] - How many of the target count have been reached.
 * @returns {Record<string, unknown>} The raw document.
 */
export function makeCountDynalistDocument(
    fileId: string = "e2e-count",
    total: number = 20,
    current: number = 10,
): Record<string, unknown> {
    const today = new Date().toLocaleDateString("en-CA");
    return makeDynalistDocument(fileId, [
        makeDynalistNode("root", "Water bottles", { note: `count ${total}/${current} ${today}` }),
    ]);
}

/**
 * Builds a Dynalist document that renders as a cross-off list: the root note
 * is `crossoff` and its children are the items; crossing off checks the first
 * item in Dynalist (via `doc/edit`) and removes it from the local list.
 * @param {string} [fileId] - Which Dynalist document this serves.
 * @param {string[]} [items] - The item contents, in order.
 * @returns {Record<string, unknown>} The raw document.
 */
export function makeCrossOffDynalistDocument(
    fileId: string = "e2e-crossoff",
    items: string[] = ["Oat milk", "Coffee beans", "Apples"],
): Record<string, unknown> {
    const itemNodes = items.map((item, index) => makeDynalistNode(`c${index + 1}`, item));
    return makeDynalistDocument(fileId, [
        makeDynalistNode("root", "Grocery run", {
            note: "crossoff",
            children: itemNodes.map((node) => node.id),
        }),
        ...itemNodes,
    ]);
}

/**
 * Builds a Dynalist document that renders as a tracker: the root note is
 * `tracking` and its children are the tracked-date nodes (ISO dates).
 * @param {string} [fileId] - Which Dynalist document this serves.
 * @param {string[]} [trackedDates] - Previously tracked dates (YYYY-MM-DD);
 *   defaults to yesterday.
 * @returns {Record<string, unknown>} The raw document.
 */
export function makeTrackingDynalistDocument(
    fileId: string = "e2e-tracking",
    trackedDates: string[] = [datePart(new Date(Date.now() - DAY))],
): Record<string, unknown> {
    const dateNodes = trackedDates.map((date, index) => makeDynalistNode(`t${index + 1}`, date));
    return makeDynalistDocument(fileId, [
        makeDynalistNode("root", "Workout habit", {
            note: "tracking",
            children: dateNodes.map((node) => node.id),
        }),
        ...dateNodes,
    ]);
}

/**
 * Intercepts the Dynalist `pref/get` token-validation endpoint used by the
 * access-token request form.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {boolean} [valid] - Whether the validation succeeds (default `true`;
 *   an invalid response carries the `_code: "InvalidToken"` marker).
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function mockDynalistTokenValidation(
    page: Page,
    valid: boolean = true,
): Promise<void> {
    await page.route("**/dynalist.io/api/v1/pref/get", (route) => {
        if (route.request().method() === "OPTIONS") {
            return route.fulfill({ status: 204, headers: OPTIONS_HEADERS });
        }
        return route.fulfill({
            status: 200,
            headers: CORS_HEADERS,
            json: valid ? { inbox_location: "top" } : { _code: "InvalidToken" },
        });
    });
}

/**
 * Intercepts the Dynalist `doc/read` and `doc/edit` endpoints. `doc/read`
 * serves the given document (counted by the returned handle); `doc/edit`
 * records each change set and answers with the ids of any inserted nodes.
 * @param {Page} page - Playwright page on which to register the routes.
 * @param {Record<string, unknown>} document - The `{ file_id, nodes }` payload to serve.
 * @returns {Promise<{
 *   edits: () => Record<string, unknown>[][];
 *   reads: () => number;
 * }>} A handle whose `edits()` returns the recorded change sets (one entry per
 *   `doc/edit` call) and whose `reads()` returns the `doc/read` call count.
 */
export async function mockDynalistDocument(
    page: Page,
    document: Record<string, unknown>,
): Promise<{
    edits: () => Record<string, unknown>[][];
    reads: () => number;
}> {
    const edits: Record<string, unknown>[][] = [];
    let reads = 0;

    await page.route("**/dynalist.io/api/v1/doc/read", (route) => {
        if (route.request().method() === "OPTIONS") {
            return route.fulfill({ status: 204, headers: OPTIONS_HEADERS });
        }
        reads += 1;
        return route.fulfill({ status: 200, headers: CORS_HEADERS, json: document });
    });

    await page.route("**/dynalist.io/api/v1/doc/edit", (route) => {
        if (route.request().method() === "OPTIONS") {
            return route.fulfill({ status: 204, headers: OPTIONS_HEADERS });
        }
        const body = (route.request().postDataJSON() ?? {}) as Record<string, unknown>;
        const changes = (body.changes ?? []) as Record<string, unknown>[];
        edits.push(changes);
        const batch = edits.length;
        const newNodeIds = changes
            .filter((change) => change.action === "insert")
            .map((_, index) => `e2e-node-${batch}-${index + 1}`);
        return route.fulfill({
            status: 200,
            headers: CORS_HEADERS,
            json: { new_node_ids: newNodeIds },
        });
    });

    return { edits: () => edits, reads: () => reads };
}
