import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { makeScenario } from "./scenarios";

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
 * task state, so close/defer round-trips behave like the live API. Returns a
 * handle for driving and observing the mock mid-test.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {ReturnType<typeof makeScenario>} scenario - The data to serve.
 * @returns {Promise<object>} A handle: `setTasks(tasks)` replaces the served
 *   open tasks (the next refresh serves them), `updates()` returns the recorded
 *   task-update (defer) calls, and `closes()` the recorded closed task ids.
 */
export async function mockTodoistApi(
    page: Page,
    scenario: ReturnType<typeof makeScenario>,
): Promise<{
    setTasks: (tasks: Record<string, unknown>[]) => void;
    updates: () => Array<{ id: string; body: Record<string, unknown> }>;
    closes: () => string[];
}> {
    const byId = new Map<string, Record<string, unknown>>(
        scenario.tasks.map((task) => [String(task.id), task]),
    );
    const closedIds = new Set<string>();
    const recordedUpdates: Array<{ id: string; body: Record<string, unknown> }> = [];
    const recordedCloses: string[] = [];

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
            const projects = scenario.projects
                ? { results: scenario.projects, next_cursor: null }
                : rawFixture("projects");
            await ok(projects);
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
            const closedId = path.slice("tasks/".length, path.length - "/close".length);
            closedIds.add(closedId);
            recordedCloses.push(closedId);
            await ok({});
            return;
        }

        const taskMatch = path.match(/^tasks\/([^/]+)$/);
        if (request.method() === "POST" && taskMatch) {
            const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
            recordedUpdates.push({ id: taskMatch[1], body });
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

    return {
        setTasks: (tasks: Record<string, unknown>[]): void => {
            byId.clear();
            closedIds.clear();
            tasks.forEach((task) => byId.set(String(task.id), task));
        },
        updates: (): Array<{ id: string; body: Record<string, unknown> }> => recordedUpdates,
        closes: (): string[] => recordedCloses,
    };
}
