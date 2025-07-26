import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    getDueTasks,
    getReverseTasks,
    filterAndSortTasks,
    compareTasks,
    processDueProperties,
    filterDueTasks,
} from "../../src/js/filter";
import type { Task, Context, DueTasksData } from "../../types/todoist";
import { mockDate, restoreDate } from "../helpers/mockDate";

vi.mock("../../src/js/time", () => ({
    getTaskTime: vi.fn(() => null),
}));

const NOW = new Date("2025-07-22T20:00:00.000Z");
let OriginalDate: DateConstructor;

const sampleContexts: Context[] = [
    {
        id: "c1",
        name: "Work",
        childOrder: 1,
        color: "berry_red",
        inboxProject: false,
        parentId: null,
        viewStyle: "list",
        url: "",
        isDeleted: false,
        updatedAt: null,
        description: "",
        isCollapsed: false,
        canAssignTasks: false,
        createdAt: null,
        isArchived: false,
        isFavorite: false,
        isFrozen: false,
        defaultOrder: 0,
        isShared: false,
    },
    {
        id: "c2",
        name: "Home",
        childOrder: 2,
        color: "berry_red",
        inboxProject: false,
        parentId: null,
        viewStyle: "list",
        url: "",
        isDeleted: false,
        updatedAt: null,
        description: "",
        isCollapsed: false,
        canAssignTasks: false,
        createdAt: null,
        isArchived: false,
        isFavorite: false,
        isFrozen: false,
        defaultOrder: 0,
        isShared: false,
    },
];

type MakeTaskParams = {
    id: number | string;
    due?: Partial<NonNullable<Task["due"]>>;
    priority?: 1 | 2 | 3 | 4;
    contextId?: string;
    content?: string;
};

function makeTask({ id, due, priority = 1, contextId = "c1", content = "" }: MakeTaskParams): Task {
    return {
        id: String(id),
        content,
        due: due
            ? {
                  isRecurring: false,
                  date: due.date ?? "",
                  string: due.string ?? "",
                  datetime: due.datetime ?? null,
                  lang: due.lang ?? null,
                  timezone: due.timezone ?? null,
                  ...due,
              }
            : null,
        priority,
        contextId,
        projectId: contextId,
        url: "",
        labels: [],
    };
}

const pastDate = "2025-07-21";
const futureDate = "2025-07-23";

describe("filter.ts", () => {
    beforeEach(() => {
        OriginalDate = mockDate(NOW);
    });

    afterEach(() => {
        vi.clearAllMocks();
        restoreDate(OriginalDate);
    });

    describe("getDueTasks", () => {
        it("returns only due tasks (past dates)", () => {
            const data: DueTasksData = {
                tasks: [
                    makeTask({ id: 1, due: { string: "yesterday", date: pastDate } }),
                    makeTask({ id: 2, due: { string: "tomorrow", date: futureDate } }),
                    makeTask({ id: 3 }),
                ],
                contexts: sampleContexts,
                user: {
                    id: "",
                    name: "",
                    email: "",
                    tz_info: { name: "UTC" },
                },
            };
            const result = getDueTasks(data);
            expect(result.map((t) => t.id)).toEqual(["1"]);
        });

        it("uses user timeZone if provided, else defaults to 'local'", () => {
            const data: DueTasksData = {
                tasks: [makeTask({ id: 1, due: { string: "past", date: pastDate } })],
                contexts: sampleContexts,
                user: {
                    id: "",
                    name: "",
                    email: "",
                    tz_info: { name: "America/Chicago" },
                },
            };

            const result = getDueTasks(data);

            expect(result.map((t) => t.id)).toEqual(["1"]);
        });
    });

    describe("getReverseTasks", () => {
        it("returns only due tasks (past dates) in reverse order", () => {
            const data: DueTasksData = {
                tasks: [
                    makeTask({ id: 1, due: { string: "yesterday", date: pastDate }, priority: 1 }),
                    makeTask({ id: 2, due: { string: "yesterday", date: pastDate }, priority: 2 }),
                    makeTask({ id: 3, due: { string: "tomorrow", date: futureDate }, priority: 3 }),
                    makeTask({ id: 4 }),
                ],
                contexts: sampleContexts,
                user: {
                    id: "",
                    name: "",
                    email: "",
                    tz_info: { name: "UTC" },
                },
            };
            const result = getReverseTasks(data);
            expect(result.map((t) => t.id)).toEqual(["1", "2"]);
        });

        it("uses user timeZone if provided, else defaults to 'local', and sets reverse: true", () => {
            const data: DueTasksData = {
                tasks: [makeTask({ id: 1, due: { string: "past", date: pastDate } })],
                contexts: sampleContexts,
                user: {
                    id: "",
                    name: "",
                    email: "",
                    tz_info: { name: "America/Chicago" },
                },
            };

            const result = getReverseTasks(data);

            expect(result.map((t) => t.id)).toEqual(["1"]);
        });
    });

    describe("filterAndSortTasks", () => {
        it("filters out tasks not due (future dates)", () => {
            const tasks: Task[] = [
                makeTask({ id: 1, due: { string: "past", date: pastDate } }),
                makeTask({ id: 2, due: { string: "future", date: futureDate } }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual(["1"]);
        });

        it("sorts by priority (lower number = higher priority)", () => {
            const tasks: Task[] = [
                makeTask({ id: 1, due: { string: "past", date: pastDate }, priority: 4 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate }, priority: 1 }),
                makeTask({ id: 3, due: { string: "past", date: pastDate }, priority: 2 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual(["1", "3", "2"]);
        });

        it("sorts by context childOrder if priorities are equal", () => {
            const tasks: Task[] = [
                makeTask({
                    id: 1,
                    due: { string: "past", date: pastDate },
                    priority: 1,
                    contextId: "c2",
                }),
                makeTask({
                    id: 2,
                    due: { string: "past", date: pastDate },
                    priority: 1,
                    contextId: "c1",
                }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual(["2", "1"]);
        });

        it("sorts by due date if priorities and context order are equal", () => {
            const tasks: Task[] = [
                makeTask({
                    id: 1,
                    due: { string: "past1", date: pastDate },
                    priority: 1,
                    contextId: "c1",
                }),
                makeTask({
                    id: 2,
                    due: { string: "past2", date: "2025-07-20" },
                    priority: 1,
                    contextId: "c1",
                }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual(["2", "1"]);
        });

        it("respects reverse option for sorting", () => {
            const tasks: Task[] = [
                makeTask({ id: 1, due: { string: "past", date: pastDate }, priority: 1 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate }, priority: 2 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, {
                timeZone: "UTC",
                reverse: true,
            });
            expect(result.map((t) => t.id)).toEqual(["1", "2"]);
        });

        it("returns all tasks unfiltered if no timeZone is provided", () => {
            const tasks: Task[] = [
                makeTask({ id: 1, due: { string: "past", date: pastDate } }),
                makeTask({ id: 2, due: { string: "future", date: futureDate } }),
                makeTask({ id: 3 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, {});
            expect(result.length).toBe(3);
        });

        it("handles tasks with missing due gracefully", () => {
            const tasks: Task[] = [
                makeTask({ id: 1 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate } }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toContain("2");
            expect(result.map((t) => t.id)).not.toContain("1");
        });
    });

    describe("internal edge cases for filter.ts", () => {
        it("compareTasks: returns 0 if priorities, context order, and timeZone are all equal/missing", () => {
            const a = makeTask({ id: 1, priority: 1 });
            const b = makeTask({ id: 2, priority: 1 });

            expect(compareTasks(a, b, {}, undefined, false)).toBe(0);
        });

        it("compareTasks: returns 0 if either a.due or b.due is missing", () => {
            const a = makeTask({ id: 1, due: { string: "past", date: pastDate } });
            const b = makeTask({ id: 2 });
            expect(compareTasks(a, b, {}, "UTC", false)).toBe(0);
            expect(compareTasks(b, a, {}, "UTC", false)).toBe(0);
        });

        it("compareTasks: sorts by context childOrder, handles missing contextId", () => {
            const a = makeTask({
                id: 1,
                contextId: undefined,
                priority: 1,
                due: { string: "past", date: pastDate },
            });
            const b = makeTask({
                id: 2,
                contextId: "c1",
                priority: 1,
                due: { string: "past", date: pastDate },
            });

            expect(compareTasks(a, b, { c1: 1 }, "UTC", false)).toBe(-1);
            expect(compareTasks(b, a, { c1: 1 }, "UTC", false)).toBe(1);
        });

        it("compareTasks: sorts by due date when priorities and context order are equal", () => {
            const a = makeTask({
                id: 1,
                due: { string: "past", date: "2025-07-20" },
                priority: 1,
                contextId: "c1",
            });
            const b = makeTask({
                id: 2,
                due: { string: "past", date: "2025-07-21" },
                priority: 1,
                contextId: "c1",
            });
            expect(compareTasks(a, b, { c1: 1 }, "UTC", false)).toBeLessThan(0);
            expect(compareTasks(a, b, { c1: 1 }, "UTC", true)).toBeGreaterThan(0);
        });

        it("processDueProperties: returns false if task.due is missing", () => {
            const task = makeTask({ id: 1 });
            expect(processDueProperties(task, "UTC", new Date(NOW))).toBe(false);
        });

        it("filterDueTasks: returns empty if all tasks are not due", () => {
            const tasks = [
                makeTask({ id: 1, due: { string: "future", date: futureDate } }),
                makeTask({ id: 2 }),
            ];
            expect(filterDueTasks(tasks, "UTC", new Date(NOW))).toEqual([]);
        });
    });
});
