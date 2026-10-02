import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";
import { DateTime } from "luxon";
import { applySyncCommands, applyTaskUpdate } from "./mock-state";
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
 * Filters activity events to the requested date range (date_from inclusive,
 * date_to exclusive), matching the live API's behavior.
 * @param {Record<string, unknown>[]} events - The events to filter.
 * @param {string | null} dateFrom - The inclusive start day (yyyy-MM-dd), or null.
 * @param {string | null} dateTo - The exclusive end day (yyyy-MM-dd), or null.
 * @returns {Record<string, unknown>[]} The events inside the range.
 */
function filterActivityByDate(
    events: Record<string, unknown>[],
    dateFrom: string | null,
    dateTo: string | null,
): Record<string, unknown>[] {
    return events.filter((event) => {
        const day = DateTime.fromISO(String(event.event_date)).toISODate() ?? "";
        return (!dateFrom || day >= dateFrom) && (!dateTo || day < dateTo);
    });
}

/**
 * Intercepts `api.todoist.com/api/v1/**` and serves the scenario with mutable
 * task state, so close/defer round-trips behave like the live API. Returns a
 * handle for driving and observing the mock mid-test.
 * @param {Page} page - Playwright page on which to register the route.
 * @param {ReturnType<typeof makeScenario>} scenario - The data to serve.
 * @returns {Promise<object>} A handle: `setTasks(tasks)` replaces the served
 *   open tasks (the next refresh serves them), `updates()` returns the recorded
 *   task-update (defer) calls, `closes()` the recorded closed task ids,
 *   `syncs()` the recorded `POST /sync` request bodies, and `taskFetches()`
 *   the number of `GET /tasks` fetches served. `project_reorder` sync commands
 *   are persisted, so later projects fetches serve the new `child_order`
 *   values. `activityRequests()` returns the recorded `GET /activities`
 *   query parameters (`date_from`, `date_to`, `object_id`, `cursor`, ...) in order.
 */
export async function mockTodoistApi(
    page: Page,
    scenario: ReturnType<typeof makeScenario>,
): Promise<{
    setTasks: (tasks: Record<string, unknown>[]) => void;
    updates: () => Array<{ id: string; body: Record<string, unknown> }>;
    closes: () => string[];
    syncs: () => Record<string, unknown>[];
    taskFetches: () => number;
    activityRequests: () => Array<Record<string, string | null>>;
}> {
    const byId = new Map<string, Record<string, unknown>>(
        scenario.tasks.map((task) => [String(task.id), task]),
    );
    const closedIds = new Set<string>();
    const recordedActivityRequests: Array<Record<string, string | null>> = [];
    let taskFetchCount = 0;
    const recordedUpdates: Array<{ id: string; body: Record<string, unknown> }> = [];
    const recordedCloses: string[] = [];
    const recordedSyncs: Record<string, unknown>[] = [];
    let servedProjects: Record<string, unknown>[] | null = scenario.projects
        ? [...scenario.projects]
        : null;

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
            taskFetchCount += 1;
            const results = [...byId.values()].filter((task) => !closedIds.has(String(task.id)));
            await ok({ results, next_cursor: null });
            return;
        }

        if (request.method() === "GET" && path === "projects") {
            const projects = servedProjects
                ? { results: servedProjects, next_cursor: null }
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
            const params = url.searchParams;
            recordedActivityRequests.push(Object.fromEntries(params.entries()));
            const events = filterActivityByDate(
                scenario.activity[params.get("object_id") ?? ""] ?? [],
                params.get("date_from"),
                params.get("date_to"),
            );
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
            const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
            recordedSyncs.push(body);
            if (servedProjects) {
                servedProjects = applySyncCommands(servedProjects, body);
            }
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
        syncs: (): Record<string, unknown>[] => recordedSyncs,
        taskFetches: (): number => taskFetchCount,
        activityRequests: (): Array<Record<string, string | null>> => recordedActivityRequests,
    };
}
