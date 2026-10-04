import type { Page } from "@playwright/test";
import { createMockState, handleMockRoute } from "./mock-router";
import { makeScenario } from "./scenarios";

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
    const state = createMockState(scenario);

    await page.route("**/api.todoist.com/api/v1/**", (route) => handleMockRoute(state, route));

    return {
        setTasks: (tasks: Record<string, unknown>[]): void => {
            state.byId.clear();
            state.closedIds.clear();
            tasks.forEach((task) => state.byId.set(String(task.id), task));
        },
        updates: (): Array<{ id: string; body: Record<string, unknown> }> => state.recordedUpdates,
        closes: (): string[] => state.recordedCloses,
        syncs: (): Record<string, unknown>[] => state.recordedSyncs,
        taskFetches: (): number => state.taskFetchCount,
        activityRequests: (): Array<Record<string, string | null>> =>
            state.recordedActivityRequests,
    };
}
