/**
 * Builders for deterministic synthetic Todoist tasks and projects in the raw
 * wire format (snake_case), modeled on the shapes in `tests/e2e/fixtures/`.
 */

/** Real project ids from the fixture, used as contexts in the scenarios. */
export const E2E_PROJECTS = {
    selfCare: "6CrfrM2x34Qprfmh",
    home: "6CrfrM2wxrGX2Gwm",
} as const;

/** Synthetic project ids served by `makeMultiContextScenario`. */
export const E2E_CONTEXTS = {
    inbox: "e2e-inbox",
    reading: "e2e-ctx-reading",
    gardening: "e2e-ctx-gardening",
    errands: "e2e-ctx-errands",
} as const;

const DAY = 24 * 60 * 60 * 1000;

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
 * Builds a wire-format task whose due date is in the past (all-day), so a
 * successful refresh auto-defers it to today.
 * @param {string} id - The unique task identifier.
 * @param {string} content - The task title.
 * @param {number} [daysAgo] - How many days in the past the task is due.
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw task.
 */
export function makeOverdueTask(
    id: string,
    content: string,
    daysAgo: number = 1,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return makeTask(id, content, {
        due: dueObject(new Date(Date.now() - daysAgo * DAY), true),
        ...overrides,
    });
}

/**
 * Builds a wire-format task due at the given local moment (a timed task,
 * so it appears in the agenda hour grid).
 * @param {string} id - The unique task identifier.
 * @param {string} content - The task title.
 * @param {Date} date - The due moment in local time.
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw task.
 */
export function makeTimedTask(
    id: string,
    content: string,
    date: Date,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return makeTask(id, content, {
        due: dueObject(date),
        ...overrides,
    });
}

/**
 * Builds a wire-format routine task: the "never-mark-done" label makes the app
 * flag it as `neverDone` (done and history buttons hidden), and the recurring
 * due date makes "done" mean re-defer to today first, then close.
 * @param {string} id - The unique task identifier.
 * @param {string} content - The task title.
 * @param {string} [dueString] - The recurring due string; when it defines a
 *   time (e.g. "every day at 9am"), that time is preserved by re-defers.
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw task.
 */
export function makeRoutineTask(
    id: string,
    content: string,
    dueString: string = "every day at 9am",
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return makeTask(id, content, {
        labels: ["never-mark-done"],
        due: {
            ...dueObject(new Date(), true),
            string: dueString,
            is_recurring: true,
        },
        ...overrides,
    });
}

/**
 * Builds a Todoist wire-format project (context).
 * @param {string} id - The project identifier.
 * @param {string} name - The context name shown in the sidebar.
 * @param {number} [childOrder] - The context sort order (lower sorts first).
 * @param {Record<string, unknown>} [overrides] - Wire fields that override the defaults.
 * @returns {Record<string, unknown>} The raw project.
 */
export function makeProject(
    id: string,
    name: string,
    childOrder: number = 1,
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    const now = new Date().toISOString();
    return {
        id,
        name,
        inbox_project: false,
        parent_id: null,
        is_archived: false,
        is_deleted: false,
        is_collapsed: false,
        is_favorite: false,
        is_frozen: false,
        is_shared: false,
        view_style: "list",
        color: "berry_red",
        child_order: childOrder,
        order_key: "a1",
        // Fields required by the SDK's project schema:
        can_assign_tasks: false,
        created_at: now,
        updated_at: now,
        default_order: 1,
        description: "",
        ...overrides,
    };
}
