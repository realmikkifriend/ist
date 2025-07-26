import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import {
    getDueTasksGroupedByContext,
    getDueTaskCountByContext,
    handleBadgeClick,
} from "../../src/html/sidebar/sidebar";

vi.mock("../../src/js/first", () => ({
    updateFirstDueTask: vi.fn(() => Promise.resolve()),
}));
import { updateFirstDueTask } from "../../src/js/first";

vi.mock("svelte/store", async () => {
    const actual = await vi.importActual<typeof import("svelte/store")>("svelte/store");
    return {
        ...actual,
        get: vi.fn(),
    };
});
vi.mock("../../src/js/stores", () => ({
    todoistData: {},
    userSettings: {
        selectedContext: null,
        update: vi.fn(),
    },
    firstDueTask: {},
    previousFirstDueTask: { set: vi.fn() },
}));

import { get } from "svelte/store";
import { userSettings, previousFirstDueTask } from "../../src/js/stores";

function resetMocks() {
    (get as Mock).mockReset();
    (userSettings.update as Mock).mockReset();
    (previousFirstDueTask.set as Mock).mockReset();
    (updateFirstDueTask as Mock).mockClear();
}

describe("sidebar.ts", () => {
    beforeEach(() => {
        resetMocks();
    });

    afterEach(() => {
        resetMocks();
    });

    describe("getDueTasksGroupedByContext", () => {
        it("returns an empty object if no dueTasks", () => {
            (get as Mock).mockReturnValueOnce({});
            const result = getDueTasksGroupedByContext();
            expect(result).toEqual({});
        });

        it("groups tasks by context and counts priorities", () => {
            const tasks = [
                { contextId: "a", priority: 1 },
                { contextId: "a", priority: 2 },
                { contextId: "b", priority: 1 },
                { contextId: "a", priority: 1 },
            ];
            (get as Mock).mockReturnValueOnce({ dueTasks: tasks });
            const result = getDueTasksGroupedByContext();
            expect(result).toEqual({
                a: { total: 3, priorities: { 1: 2, 2: 1 } },
                b: { total: 1, priorities: { 1: 1 } },
            });
        });
    });

    describe("getDueTaskCountByContext", () => {
        it("returns 0 if no dueTasks", () => {
            (get as Mock).mockReturnValueOnce({});
            const count = getDueTaskCountByContext("a");
            expect(count).toBe(0);
        });

        it("returns 0 if contextId is falsy", () => {
            (get as Mock).mockReturnValueOnce({
                dueTasks: [{ contextId: "a" }],
            });
            const count = getDueTaskCountByContext("");
            expect(count).toBe(0);
        });

        it("counts tasks for the given contextId", () => {
            const tasks = [{ contextId: "a" }, { contextId: "b" }, { contextId: "a" }];
            (get as Mock).mockReturnValueOnce({ dueTasks: tasks });
            const count = getDueTaskCountByContext("a");
            expect(count).toBe(2);
        });
    });

    describe("handleBadgeClick", () => {
        const originalLocation = { value: undefined as Location | undefined };

        beforeEach(() => {
            originalLocation.value = globalThis.window?.location;
            Object.defineProperty(globalThis.window, "location", {
                value: { hash: "" },
                configurable: true,
                writable: true,
            });
        });

        afterEach(() => {
            Object.defineProperty(globalThis.window, "location", {
                value: originalLocation.value,
                configurable: true,
                writable: true,
            });
        });

        it("navigates to summoned hash, resets summoned/skip, and updates first due task", () => {
            const summonedTask = { summoned: "#foo", skip: true };
            (get as Mock)
                .mockReturnValueOnce(summonedTask)
                .mockReturnValueOnce({ selectedContext: null });

            handleBadgeClick();

            expect(globalThis.window.location.hash).toBe("#foo");
            expect(summonedTask.summoned).toBe(false);
            expect(summonedTask.skip).toBeUndefined();
            expect(updateFirstDueTask).toHaveBeenCalled();
        });

        it("clears selected context if no summoned, but selectedContext is set", () => {
            (get as Mock).mockReturnValueOnce({}).mockReturnValueOnce({ selectedContext: "abc" });

            handleBadgeClick();

            expect(previousFirstDueTask.set).toHaveBeenCalledWith(null);
            expect(userSettings.update).toHaveBeenCalled();
        });

        it("does nothing if no summoned and no selectedContext", () => {
            (get as Mock).mockReturnValueOnce({}).mockReturnValueOnce({ selectedContext: null });

            handleBadgeClick();

            expect(previousFirstDueTask.set).not.toHaveBeenCalled();
            expect(userSettings.update).not.toHaveBeenCalled();
        });
    });
});
