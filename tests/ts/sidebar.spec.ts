import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import type { Mock } from "vitest";

export const mockGet = vi.fn();

let updateFirstDueTask: Mock;

import {
    resetStoreMocks,
    userSettingsUpdateSpy,
    previousFirstDueTaskSetSpy,
} from "../../tests/helpers/mockStores";

let getDueTasksGroupedByContext: typeof import("../../src/html/sidebar/sidebar").getDueTasksGroupedByContext;
let getDueTaskCountByContext: typeof import("../../src/html/sidebar/sidebar").getDueTaskCountByContext;
let handleBadgeClick: typeof import("../../src/html/sidebar/sidebar").handleBadgeClick;

describe("sidebar.ts", () => {
    beforeAll(async () => {
        vi.doMock("svelte/store", async (importOriginal) => {
            const actual = await importOriginal<typeof import("svelte/store")>();
            return {
                ...actual,
                get: mockGet,
            };
        });

        vi.doMock("../../src/js/first", () => ({
            updateFirstDueTask: vi.fn(() => Promise.resolve()),
        }));

        const sidebarModule = await import("../../src/html/sidebar/sidebar");
        getDueTasksGroupedByContext = sidebarModule.getDueTasksGroupedByContext;
        getDueTaskCountByContext = sidebarModule.getDueTaskCountByContext;
        handleBadgeClick = sidebarModule.handleBadgeClick;

        const firstModule = await import("../../src/js/first");
        updateFirstDueTask = firstModule.updateFirstDueTask as Mock;
    });

    beforeEach(() => {
        resetStoreMocks();
    });

    afterEach(() => {
        resetStoreMocks();
        vi.clearAllMocks();
    });

    describe("getDueTasksGroupedByContext", () => {
        it("returns an empty object if no dueTasks", () => {
            mockGet.mockReturnValueOnce({ dueTasks: [] }); // Corrected: return just the content of todoistData
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
            mockGet.mockReturnValueOnce({ dueTasks: tasks }); // Corrected
            const result = getDueTasksGroupedByContext();
            expect(result).toEqual({
                a: { total: 3, priorities: { 1: 2, 2: 1 } },
                b: { total: 1, priorities: { 1: 1 } },
            });
        });
    });

    describe("getDueTaskCountByContext", () => {
        it("returns 0 if no dueTasks", () => {
            mockGet.mockReturnValueOnce({ dueTasks: [] }); // Corrected
            const count = getDueTaskCountByContext("a");
            expect(count).toBe(0);
        });

        it("returns 0 if contextId is falsy", () => {
            mockGet.mockReturnValueOnce({
                dueTasks: [{ contextId: "a" }],
            }); // Corrected
            const count = getDueTaskCountByContext("");
            expect(count).toBe(0);
        });

        it("counts tasks for the given contextId", () => {
            const tasks = [{ contextId: "a" }, { contextId: "b" }, { contextId: "a" }];
            mockGet.mockReturnValueOnce({ dueTasks: tasks }); // Corrected
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
            mockGet
                .mockReturnValueOnce(summonedTask) // For $firstDueTask
                .mockReturnValueOnce({ selectedContext: null }); // For selectedContext

            handleBadgeClick();

            expect(globalThis.window.location.hash).toBe("#foo");
            expect(summonedTask.summoned).toBe(false);
            expect(summonedTask.skip).toBeUndefined();
            expect(updateFirstDueTask).toHaveBeenCalled();
        });

        it("clears selected context if no summoned, but selectedContext is set", () => {
            mockGet
                .mockReturnValueOnce({ summoned: false }) // For $firstDueTask
                .mockReturnValueOnce({ selectedContext: "abc" }); // For selectedContext

            handleBadgeClick();

            expect(previousFirstDueTaskSetSpy).toHaveBeenCalledWith(null);
            expect(userSettingsUpdateSpy).toHaveBeenCalled();
        });

        it("does nothing if no summoned and no selectedContext", () => {
            mockGet
                .mockReturnValueOnce({ summoned: false }) // For $firstDueTask
                .mockReturnValueOnce({ selectedContext: null }); // For selectedContext

            handleBadgeClick();

            expect(previousFirstDueTaskSetSpy).not.toHaveBeenCalled();
            expect(userSettingsUpdateSpy).not.toHaveBeenCalled();
        });
    });
});
