import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Route } from "@playwright/test";
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
 * Builds the mutable state shared between the mock's route handler and its
 * test handle (recorded calls, open-task map, served projects).
 * @param {ReturnType<typeof makeScenario>} scenario - The data to serve.
 * @returns {object} The mutable mock state.
 */
export function createMockState(scenario: ReturnType<typeof makeScenario>) {
    return {
        scenario,
        byId: new Map<string, Record<string, unknown>>(
            scenario.tasks.map((task) => [String(task.id), task]),
        ),
        closedIds: new Set<string>(),
        taskFetchCount: 0,
        recordedUpdates: [] as Array<{ id: string; body: Record<string, unknown> }>,
        recordedCloses: [] as string[],
        recordedSyncs: [] as Record<string, unknown>[],
        recordedActivityRequests: [] as Array<Record<string, string | null>>,
        servedProjects: scenario.projects ? [...scenario.projects] : null,
    };
}

/**
 * Serves one intercepted `api.todoist.com/api/v1/**` request from the mock
 * state: tasks/projects/user/comments/activities reads, task close/update,
 * sync (persisting `project_reorder`), and a 404 for unmocked calls.
 * @param {ReturnType<typeof createMockState>} state - The mutable mock state.
 * @param {Route} route - The intercepted Playwright route to fulfill.
 * @returns {Promise<void>} Resolves once the route is fulfilled.
 */
export async function handleMockRoute(
    state: ReturnType<typeof createMockState>,
    route: Route,
): Promise<void> {
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
        state.taskFetchCount += 1;
        const results = [...state.byId.values()].filter(
            (task) => !state.closedIds.has(String(task.id)),
        );
        await ok({ results, next_cursor: null });
        return;
    }

    if (request.method() === "GET" && path === "projects") {
        const projects = state.servedProjects
            ? { results: state.servedProjects, next_cursor: null }
            : rawFixture("projects");
        await ok(projects);
        return;
    }

    if (request.method() === "GET" && path === "user") {
        await ok(rawFixture("user"));
        return;
    }

    if (request.method() === "GET" && path === "comments") {
        const comments = state.scenario.comments[url.searchParams.get("task_id") ?? ""] ?? [];
        await ok({ results: comments, next_cursor: null });
        return;
    }

    if (request.method() === "GET" && path === "activities") {
        const params = url.searchParams;
        state.recordedActivityRequests.push(Object.fromEntries(params.entries()));
        const events = filterActivityByDate(
            state.scenario.activity[params.get("object_id") ?? ""] ?? [],
            params.get("date_from"),
            params.get("date_to"),
        );
        await ok({ results: events, next_cursor: null });
        return;
    }

    if (request.method() === "POST" && path.endsWith("/close")) {
        const closedId = path.slice("tasks/".length, path.length - "/close".length);
        state.closedIds.add(closedId);
        state.recordedCloses.push(closedId);
        await ok({});
        return;
    }

    const taskMatch = path.match(/^tasks\/([^/]+)$/);
    if (request.method() === "POST" && taskMatch) {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        state.recordedUpdates.push({ id: taskMatch[1], body });
        const updated = applyTaskUpdate(state.byId.get(taskMatch[1]) ?? {}, body);
        state.byId.set(taskMatch[1], updated);
        await ok(updated);
        return;
    }

    if (request.method() === "POST" && path === "sync") {
        const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
        state.recordedSyncs.push(body);
        if (state.servedProjects) {
            state.servedProjects = applySyncCommands(state.servedProjects, body);
        }
        await ok({});
        return;
    }

    await route.fulfill({
        status: 404,
        headers: CORS_HEADERS,
        json: { error: `Unmocked Todoist call: ${request.method()} ${path}` },
    });
}
