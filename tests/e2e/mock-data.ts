/**
 * Builders for deterministic synthetic Todoist data in the raw wire format
 * (snake_case), modeled on the shapes in `tests/e2e/fixtures/`.
 */

/** Real project ids from the fixture, used as contexts in the scenarios. */
const E2E_PROJECTS = {
    selfCare: "6CrfrM2x34Qprfmh",
    home: "6CrfrM2wxrGX2Gwm",
} as const;

const pad = (value: number): string => String(value).padStart(2, "0");

const datePart = (date: Date): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const dateTimePart = (date: Date): string =>
    `${datePart(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

/**
 * Builds a Todoist wire-format `due` object for the given local date.
 *
 * Matches the live API behavior: when a time of day is set, `due.date`
 * contains the full local datetime (e.g. "2026-09-28T20:00:00"); when the
 * task is all-day, it is date-only.
 * @param {Date} date - The due moment in local time.
 * @param {boolean} [allDay] - When true, no time of day is set.
 * @returns {Record<string, unknown>} The due object in wire format.
 */
export function dueObject(date: Date, allDay: boolean = false): Record<string, unknown> {
    return allDay
        ? { date: datePart(date), timezone: null, string: "", lang: null, is_recurring: false }
        : {
              date: dateTimePart(date),
              timezone: null,
              string: "",
              lang: null,
              is_recurring: false,
          };
}

/**
 * Builds a minimal, schema-valid Todoist task in wire (snake_case) format.
 * @param {string} id - The unique task identifier.
 * @param {string} content - The task title.
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw task.
 */
export function makeTask(
    id: string,
    content: string,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
        user_id: "17324928",
        id,
        project_id: E2E_PROJECTS.selfCare,
        section_id: null,
        parent_id: null,
        added_by_uid: "17324928",
        assigned_by_uid: null,
        responsible_uid: null,
        labels: [],
        deadline: null,
        duration: null,
        is_collapsed: false,
        checked: false,
        is_deleted: false,
        added_at: now,
        completed_at: null,
        updated_at: now,
        due: null,
        priority: 1,
        child_order: 1,
        order_key: "a1",
        content,
        description: "",
        note_count: 0,
        day_order: 1,
        ...overrides,
    };
}

/**
 * Builds the standard e2e scenario with five deterministic tasks: alpha, beta
 * and gamma are due earlier today (display order alpha, beta, gamma), delta is
 * due tomorrow at noon (agenda only) and epsilon has no due date.
 * @param {object} [overrides] - Optional scenario fields to replace the defaults with.
 * @param {Record<string, unknown>[]} [overrides.tasks] - The open tasks to serve.
 * @param {Record<string, Record<string, unknown>[]>} [overrides.comments] - Comments keyed by task id.
 * @param {Record<string, Record<string, unknown>[]>} [overrides.activity] - Activity events keyed by task id.
 * @returns {object} The scenario with `tasks`, `comments` and `activity` arrays.
 */
export function makeScenario(
    overrides: {
        tasks?: Record<string, unknown>[];
        comments?: Record<string, Record<string, unknown>[]>;
        activity?: Record<string, Record<string, unknown>[]>;
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
        ...overrides,
    };
}
