import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { makeScenario } from "./mock-data";

const CORS_HEADERS: Record<string, string> = { "access-control-allow-origin": "*" };

/**
 * Reads a raw e2e fixture file (wire format) from the local fixtures directory.
 * @param {"projects" | "user"} name - The fixture to load.
 * @returns {unknown} The parsed fixture contents.
 */
function rawFixture(name: "projects" | "user"): unknown {
    const file = path.join(__dirname, "fixtures", `${name}.json`);
    if (!existsSync(file)) {
        throw new Error(
            `Missing e2e fixture "${file}". Run "node tests/e2e/download-fixtures.mjs" first.`,
        );
    }
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

/**
 * Applies a wire-format task update (due date fields) to a raw task.
 * @param {Record<string, unknown>} task - The raw task to update.
 * @param {Record<string, unknown>} body - The snake_case update body sent to the API.
 * @returns {Record<string, unknown>} The updated raw task.
 */
function applyTaskUpdate(
    task: Record<string, unknown>,
    body: Record<string, unknown>,
): Record<string, unknown> {
    const due = (task.due ?? {}) as Record<string, unknown>;
    return {
        ...task,
        due: {
            ...due,
            ...(typeof body.due_string === "string" ? { string: body.due_string } : {}),
            ...(typeof body.due_date === "string" ? { date: body.due_date, datetime: null } : {}),
            ...(typeof body.due_datetime === "string"
                ? { date: body.due_datetime.slice(0, 10), datetime: body.due_datetime }
                : {}),
        },
    };
}

/**
 * Intercepts `api.todoist.com/api/v1/**` and serves the scenario with mutable
 * task state, so close/defer round-trips behave like the live API.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {ReturnType<typeof makeScenario>} scenario - The data to serve.
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function mockTodoistApi(
    page: Page,
    scenario: ReturnType<typeof makeScenario>,
): Promise<void> {
    const byId = new Map<string, Record<string, unknown>>(
        scenario.tasks.map((task) => [String(task.id), task]),
    );
    const closedIds = new Set<string>();

    await page.route("**/api.todoist.com/api/v1/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname.replace(/.*\/api\/v1\//, "");
        const ok = (json: unknown) => route.fulfill({ status: 200, headers: CORS_HEADERS, json });

        if (request.method() === "OPTIONS") {
            await route.fulfill({
                status: 204,
                headers: {
                    ...CORS_HEADERS,
                    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                    "access-control-allow-headers": "authorization, content-type, x-request-id",
                },
            });
            return;
        }

        if (request.method() === "GET" && path === "tasks") {
            const results = [...byId.values()].filter((task) => !closedIds.has(String(task.id)));
            await ok({ results, next_cursor: null });
            return;
        }

        if (request.method() === "GET" && path === "projects") {
            await ok(rawFixture("projects"));
            return;
        }

        if (request.method() === "GET" && path === "user") {
            await ok(rawFixture("user"));
            return;
        }

        if (request.method() === "GET" && path === "comments") {
            const comments = scenario.comments[url.searchParams.get("task_id") ?? ""] ?? [];
            await ok({ results: comments, next_cursor: null });
            return;
        }

        if (request.method() === "GET" && path === "activities") {
            const events = scenario.activity[url.searchParams.get("object_id") ?? ""] ?? [];
            await ok({ results: events, next_cursor: null });
            return;
        }

        if (request.method() === "POST" && path.endsWith("/close")) {
            closedIds.add(path.slice("tasks/".length, path.length - "/close".length));
            await ok({});
            return;
        }

        const taskMatch = path.match(/^tasks\/([^/]+)$/);
        if (request.method() === "POST" && taskMatch) {
            const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
            const updated = applyTaskUpdate(byId.get(taskMatch[1]) ?? {}, body);
            byId.set(taskMatch[1], updated);
            await ok(updated);
            return;
        }

        if (request.method() === "POST" && path === "sync") {
            await ok({});
            return;
        }

        await route.fulfill({
            status: 404,
            headers: CORS_HEADERS,
            json: { error: `Unmocked Todoist call: ${request.method()} ${path}` },
        });
    });
}

/**
 * Seeds localStorage (JSON-serialized, matching svelte-persisted-store) before
 * any app script runs.
 * @param {Page} page - Playwright page to seed.
 * @param {Record<string, unknown>} entries - Storage keys mapped to values.
 * @returns {Promise<void>} Resolves once the init script is registered.
 */
export async function seedLocalStorage(
    page: Page,
    entries: Record<string, unknown>,
): Promise<void> {
    await page.addInitScript((initial) => {
        Object.entries(initial).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }, entries);
}

/**
 * Intercepts the Dynalist `doc/read` endpoint and serves the given document.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {Record<string, unknown>} document - The `{ file_id, nodes }` payload to serve.
 * @returns {Promise<void>} Resolves once the route is registered.
 */
export async function mockDynalistDocument(
    page: Page,
    document: Record<string, unknown>,
): Promise<void> {
    await page.route("**/dynalist.io/api/v1/doc/read", (route) => {
        if (route.request().method() === "OPTIONS") {
            return route.fulfill({
                status: 204,
                headers: {
                    ...CORS_HEADERS,
                    "access-control-allow-methods": "POST, OPTIONS",
                    "access-control-allow-headers": "content-type",
                },
            });
        }
        return route.fulfill({ status: 200, headers: CORS_HEADERS, json: document });
    });
}
