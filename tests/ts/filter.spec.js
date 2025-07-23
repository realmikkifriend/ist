import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getDueTasks, filterAndSortTasks } from "../../src/js/filter";
import { DateTime } from "luxon";

// Mock getTaskTime to always return null (no extracted time) unless specified
vi.mock("../../src/js/time", () => ({
    getTaskTime: vi.fn((str) => null),
}));

// Helper: freeze time for consistent tests
const NOW = new Date("2025-07-22T20:00:00.000Z");
vi.stubGlobal(
    "Date",
    class extends Date {
        constructor(...args) {
            if (args.length === 0) return new (Object.getPrototypeOf(NOW).constructor)(NOW);
            return new (Object.getPrototypeOf(NOW).constructor)(...args);
        }
        static now() {
            return NOW.getTime();
        }
        static parse = Date.parse;
        static UTC = Date.UTC;
        static get [Symbol.species]() {
            return Date;
        }
    },
);

// Sample data
const sampleContexts = [
    { id: "c1", name: "Work", childOrder: 1 },
    { id: "c2", name: "Home", childOrder: 2 },
];

function makeTask({ id, due, priority = 1, contextId = "c1", content = "" }) {
    return {
        id,
        content,
        due: due
            ? {
                  ...due,
                  // .string, .date, .datetime are expected
              }
            : undefined,
        priority,
        contextId,
    };
}

const pastDate = "2025-07-21";
const futureDate = "2025-07-23";
const pastDateTime = "2025-07-21T10:00:00.000Z";
const futureDateTime = "2025-07-23T10:00:00.000Z";

describe("filter.ts", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("getDueTasks", () => {
        it("returns only due tasks (past dates)", () => {
            const data = {
                tasks: [
                    makeTask({ id: 1, due: { string: "yesterday", date: pastDate } }),
                    makeTask({ id: 2, due: { string: "tomorrow", date: futureDate } }),
                    makeTask({ id: 3 }), // no due
                ],
                contexts: sampleContexts,
                user: { tz_info: { name: "UTC" } },
            };
            const result = getDueTasks(data);
            expect(result.map((t) => t.id)).toEqual([1]);
        });

        it("uses user timeZone if provided, else defaults to 'local'", () => {
            const data = {
                tasks: [makeTask({ id: 1, due: { string: "past", date: pastDate } })],
                contexts: sampleContexts,
                user: { tz_info: { name: "America/Chicago" } },
            };
            const spy = vi.spyOn({ filterAndSortTasks }, "filterAndSortTasks");
            getDueTasks(data);
            expect(spy).toHaveBeenCalledWith(
                data.tasks,
                data.contexts,
                expect.objectContaining({ timeZone: "America/Chicago" }),
            );
            spy.mockRestore();
        });
    });

    describe("filterAndSortTasks", () => {
        it("filters out tasks not due (future dates)", () => {
            const tasks = [
                makeTask({ id: 1, due: { string: "past", date: pastDate } }),
                makeTask({ id: 2, due: { string: "future", date: futureDate } }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual([1]);
        });

        it("sorts by priority (lower number = higher priority)", () => {
            const tasks = [
                makeTask({ id: 1, due: { string: "past", date: pastDate }, priority: 4 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate }, priority: 1 }),
                makeTask({ id: 3, due: { string: "past", date: pastDate }, priority: 2 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toEqual([2, 3, 1]);
        });

        it("sorts by context childOrder if priorities are equal", () => {
            const tasks = [
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
            expect(result.map((t) => t.id)).toEqual([2, 1]); // c1 (order 1) before c2 (order 2)
        });

        it("sorts by due date if priorities and context order are equal", () => {
            const tasks = [
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
            expect(result.map((t) => t.id)).toEqual([2, 1]); // earlier date first
        });

        it("respects reverse option for sorting", () => {
            const tasks = [
                makeTask({ id: 1, due: { string: "past", date: pastDate }, priority: 1 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate }, priority: 2 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, {
                timeZone: "UTC",
                reverse: true,
            });
            expect(result.map((t) => t.id)).toEqual([2, 1]);
        });

        it("returns all tasks unfiltered if no timeZone is provided", () => {
            const tasks = [
                makeTask({ id: 1, due: { string: "past", date: pastDate } }),
                makeTask({ id: 2, due: { string: "future", date: futureDate } }),
                makeTask({ id: 3 }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, {});
            expect(result.length).toBe(3);
        });

        it("handles tasks with missing due gracefully", () => {
            const tasks = [
                makeTask({ id: 1 }),
                makeTask({ id: 2, due: { string: "past", date: pastDate } }),
            ];
            const result = filterAndSortTasks(tasks, sampleContexts, { timeZone: "UTC" });
            expect(result.map((t) => t.id)).toContain(2);
            expect(result.map((t) => t.id)).not.toContain(1);
        });
    });
});
