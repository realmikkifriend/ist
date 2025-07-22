import { get, updateFirstDueTaskMock, stores } from "./_mocks.js";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    getDueTasksGroupedByContext,
    getDueTaskCountByContext,
    handleBadgeClick,
} from "../../src/html/sidebar/sidebar";

describe("sidebar.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("getDueTasksGroupedByContext", () => {
        it("groups due tasks by context and counts priorities", () => {
            const dueTasks = [
                { contextId: "ctx1", priority: 1 },
                { contextId: "ctx1", priority: 2 },
                { contextId: "ctx2", priority: 1 },
                { contextId: "ctx1", priority: 1 },
            ];
            get.mockReturnValue({ dueTasks });

            const result = getDueTasksGroupedByContext();
            expect(result).toEqual({
                ctx1: {
                    total: 3,
                    priorities: { 1: 2, 2: 1 },
                },
                ctx2: {
                    total: 1,
                    priorities: { 1: 1 },
                },
            });
        });

        it("returns empty object if no dueTasks", () => {
            get.mockReturnValue({});
            expect(getDueTasksGroupedByContext()).toEqual({});
        });

        it("returns empty object if dueTasks is empty array", () => {
            get.mockReturnValue({ dueTasks: [] });
            expect(getDueTasksGroupedByContext()).toEqual({});
        });
    });

    describe("getDueTaskCountByContext", () => {
        it("returns the count of due tasks for a specific context", () => {
            const dueTasks = [{ contextId: "ctx1" }, { contextId: "ctx2" }, { contextId: "ctx1" }];
            get.mockReturnValue({ dueTasks });

            expect(getDueTaskCountByContext("ctx1")).toBe(2);
            expect(getDueTaskCountByContext("ctx2")).toBe(1);
            expect(getDueTaskCountByContext("ctx3")).toBe(0);
        });

        it("returns 0 if dueTasks is undefined", () => {
            get.mockReturnValue({});
            expect(getDueTaskCountByContext("ctx1")).toBe(0);
        });

        it("returns 0 if contextId is falsy", () => {
            get.mockReturnValue({ dueTasks: [{ contextId: "ctx1" }] });
            expect(getDueTaskCountByContext("")).toBe(0);
            expect(getDueTaskCountByContext(null)).toBe(0);
        });
    });

    describe("handleBadgeClick", () => {
        let originalLocation;
        beforeEach(() => {
            // Mock window.location.hash
            originalLocation = global.window?.location;
            delete global.window;
            global.window = { location: { hash: "" } };
        });

        afterEach(() => {
            global.window = originalLocation;
        });

        it("navigates to summoned hash and updates state, calls updateFirstDueTask", () => {
            const $firstDueTask = { summoned: "#foo", skip: true };
            const $todoistData = { update: vi.fn((fn) => fn({ reverseTasks: [1] })) };
            get.mockImplementationOnce(() => $firstDueTask) // firstDueTask
                .mockImplementationOnce(() => $todoistData) // todoistData
                .mockImplementationOnce(() => ({ selectedContext: null })); // userSettings

            handleBadgeClick();

            expect(global.window.location.hash).toBe("#foo");
            expect($firstDueTask.summoned).toBe(false);
            expect($firstDueTask.skip).toBeUndefined();
            expect($todoistData.update).toHaveBeenCalled();
            expect(updateFirstDueTaskMock).toHaveBeenCalled();
        });

        it("does not call todoistData.update if update is not a function", () => {
            const $firstDueTask = { summoned: "#bar", skip: true };
            const $todoistData = { update: undefined };
            get.mockImplementationOnce(() => $firstDueTask)
                .mockImplementationOnce(() => $todoistData)
                .mockImplementationOnce(() => ({ selectedContext: null }));

            handleBadgeClick();

            expect(global.window.location.hash).toBe("#bar");
            expect(updateFirstDueTaskMock).toHaveBeenCalled();
        });

        it("clears selected context if no summoned but selectedContext is set", () => {
            // Assign spies to the store methods
            stores.previousFirstDueTask.set = vi.fn();
            stores.userSettings.update = vi.fn((fn) => fn({ selectedContext: "ctx1" }));

            get.mockImplementationOnce(() => null) // firstDueTask
                .mockImplementationOnce(() => ({})) // todoistData
                .mockImplementationOnce(() => ({ selectedContext: "ctx1" })); // userSettings

            handleBadgeClick();

            expect(stores.previousFirstDueTask.set).toHaveBeenCalledWith(null);
            expect(stores.userSettings.update).toHaveBeenCalled();
        });

        it("does nothing if no summoned and no selectedContext", () => {
            get.mockImplementationOnce(() => null)
                .mockImplementationOnce(() => ({}))
                .mockImplementationOnce(() => ({ selectedContext: null }));

            handleBadgeClick();

            // No errors, no calls
            expect(updateFirstDueTaskMock).not.toHaveBeenCalled();
        });
    });
});
