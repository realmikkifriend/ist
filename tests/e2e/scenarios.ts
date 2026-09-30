import {
    dueObject,
    E2E_CONTEXTS,
    E2E_PROJECTS,
    makeOverdueTask,
    makeProject,
    makeRoutineTask,
    makeTask,
    makeTimedTask,
} from "./mock-data";

/**
 * Builds the standard e2e scenario with five deterministic tasks: alpha, beta
 * and gamma are due earlier today (display order alpha, beta, gamma), delta is
 * due tomorrow at noon (agenda only) and epsilon has no due date.
 * @param {object} [overrides] - Optional scenario fields to replace the defaults with.
 * @param {Record<string, unknown>[]} [overrides.tasks] - The open tasks to serve.
 * @param {Record<string, Record<string, unknown>[]>} [overrides.comments] - Comments keyed by task id.
 * @param {Record<string, Record<string, unknown>[]>} [overrides.activity] - Activity events keyed by task id.
 * @param {Record<string, unknown>[]} [overrides.projects] - Projects to serve instead of the downloaded fixture.
 * @returns {object} The scenario with `tasks`, `comments`, `activity` and `projects` fields.
 */
export function makeScenario(
    overrides: {
        tasks?: Record<string, unknown>[];
        comments?: Record<string, Record<string, unknown>[]>;
        activity?: Record<string, Record<string, unknown>[]>;
        projects?: Record<string, unknown>[];
    } = {},
) {
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const tomorrowNoon = new Date(now + 24 * HOUR);
    tomorrowNoon.setHours(12, 0, 0, 0);
    return {
        tasks: [
            makeTask("task-alpha", "Alpha due task", {
                priority: 4,
                due: dueObject(new Date(now - 90 * 60 * 1000)),
            }),
            makeTask("task-beta", "Beta due task", {
                priority: 3,
                due: dueObject(new Date(now - 45 * 60 * 1000)),
            }),
            makeTask("task-gamma", "Gamma due task", {
                project_id: E2E_PROJECTS.home,
                priority: 2,
                due: dueObject(new Date(now - 3 * HOUR)),
            }),
            makeTask("task-delta", "Delta tomorrow task", {
                due: dueObject(tomorrowNoon),
            }),
            makeTask("task-epsilon", "Epsilon no date"),
        ],
        comments: {} as Record<string, Record<string, unknown>[]>,
        activity: {} as Record<string, Record<string, unknown>[]>,
        projects: overrides.projects,
        ...overrides,
    };
}

/**
 * Builds a self-contained scenario whose tasks span the synthetic contexts in
 * `E2E_CONTEXTS` (distinct `child_order` values), so context ordering,
 * per-context due counts, and task search can be asserted without depending
 * on the downloaded real projects fixture.
 * @returns {object} A scenario with `projects` and `tasks` fields.
 */
export function makeMultiContextScenario() {
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    const nineAM = new Date();
    nineAM.setHours(9, 0, 0, 0);
    return {
        projects: [
            makeProject(E2E_CONTEXTS.inbox, "Inbox", 0, { inbox_project: true }),
            makeProject(E2E_CONTEXTS.reading, "Reading", 1),
            makeProject(E2E_CONTEXTS.gardening, "Gardening", 2),
            makeProject(E2E_CONTEXTS.errands, "Errands", 3),
        ],
        tasks: [
            makeTask("task-inbox", "Inbox due task", {
                project_id: E2E_CONTEXTS.inbox,
                priority: 1,
                due: dueObject(new Date(now - 30 * 60 * 1000)),
            }),
            makeTask("task-reading", "Reading due task", {
                project_id: E2E_CONTEXTS.reading,
                priority: 3,
                due: dueObject(new Date(now - 60 * 60 * 1000)),
            }),
            makeTask("task-reading-future", "Reading future task", {
                project_id: E2E_CONTEXTS.reading,
                priority: 3,
                due: dueObject(new Date(now + 24 * HOUR)),
            }),
            makeTask("task-gardening", "Gardening due task", {
                project_id: E2E_CONTEXTS.gardening,
                priority: 4,
                due: dueObject(new Date(now - 90 * 60 * 1000)),
            }),
            makeTimedTask("task-gardening-timed", "Gardening timed task", nineAM, {
                project_id: E2E_CONTEXTS.gardening,
                priority: 2,
            }),
            makeRoutineTask("task-errands-routine", "Errands routine task", "every day", {
                project_id: E2E_CONTEXTS.errands,
            }),
            makeOverdueTask("task-errands-overdue", "Errands overdue task", 1, {
                project_id: E2E_CONTEXTS.errands,
            }),
        ],
    };
}
