import { get } from "svelte/store";
import { DateTime } from "luxon";
import { vi, describe, it, expect, beforeEach, afterEach, type Mock } from "vitest";

import { todoistData, previousFirstDueTask } from "../../src/js/stores";
import { markTaskDone, deferTasks, refreshData } from "../../src/js/api";
import { updateFirstDueTask } from "../../src/js/first";
import { handleTaskDone, handleTaskDefer, updateTaskResources } from "../../src/js/taskHandlers";
import type { Task } from "../../types/todoist";

import {
    todoistDataMockStore,
    previousFirstDueTaskMockStore,
    todoistErrorMockStore,
    resetStoreMocks,
} from "../helpers/mockStores";
import { mockDate, restoreDate } from "../helpers/mockDate";
import { testTasks } from "../helpers/testData";

vi.mock("../../src/js/api", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../src/js/api")>();
    return {
        ...actual,
        markTaskDone: vi.fn(),
        deferTasks: vi.fn(),
        refreshData: vi.fn(),
    };
});

vi.mock("../../src/js/first", () => ({
    updateFirstDueTask: vi.fn(),
}));

describe("updateTaskResources", () => {
    beforeEach(() => {
        resetStoreMocks();
        vi.clearAllMocks();
    });

    it("updates dueTasks with new due dates and sorts them", () => {
        todoistDataMockStore.set({
            dueTasks: [testTasks[0], testTasks[1]],
            tasks: [],
            contexts: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });
        const tenMinutesFromNow = DateTime.now().plus({ minutes: 10 });

        updateTaskResources([
            [testTasks[0].id, tenMinutesFromNow],
            [testTasks[1].id, fiveMinutesFromNow],
        ]);

        const $todoistData = get(todoistData);
        expect($todoistData.dueTasks[0].id).toBe(testTasks[1].id);
        expect($todoistData.dueTasks[0].due?.date).toBe(
            fiveMinutesFromNow.toJSDate().toISOString(),
        );
        expect($todoistData.dueTasks[1].id).toBe(testTasks[0].id);
        expect($todoistData.dueTasks[1].due?.date).toBe(tenMinutesFromNow.toJSDate().toISOString());
    });

    it("removes task from dueTasks if new due date is in the past", () => {
        todoistDataMockStore.set({
            dueTasks: [testTasks[0]],
            tasks: [],
            contexts: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        const fiveMinutesAgo = DateTime.now().minus({ minutes: 5 });

        updateTaskResources([[testTasks[0].id, fiveMinutesAgo]]);

        const $todoistData = get(todoistData);
        expect($todoistData.dueTasks).toHaveLength(1);
        expect($todoistData.dueTasks[0].id).toBe(testTasks[0].id);
        expect($todoistData.dueTasks[0].due?.date).toBe(fiveMinutesAgo.toJSDate().toISOString());
    });

    it("sets previousFirstDueTask to null if the first task is updated", () => {
        todoistDataMockStore.set({
            dueTasks: [testTasks[0], testTasks[1]],
            tasks: [],
            contexts: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        previousFirstDueTaskMockStore.set(testTasks[0]);
        const fiveMinutesFromNow = DateTime.now().plus({ minutes: 5 });

        updateTaskResources([[testTasks[0].id, fiveMinutesFromNow]]);

        expect(get(previousFirstDueTask)).toBeNull();
    });

    it("calls updateFirstDueTask", () => {
        updateTaskResources([]);
        expect(updateFirstDueTask).toHaveBeenCalled();
    });
});

describe("handleTaskDone", () => {
    beforeEach(() => {
        resetStoreMocks();
        vi.clearAllMocks();
        mockDate(new Date());
    });

    afterEach(() => {
        restoreDate(Date);
    });

    it("sets previousFirstDueTask to null", async () => {
        previousFirstDueTaskMockStore.set(testTasks[0]);
        await handleTaskDone(testTasks[0].id);
        expect(get(previousFirstDueTask)).toBeNull();
    });

    it("updates task resources with a due date 5 minutes from now", async () => {
        todoistDataMockStore.set({
            dueTasks: [testTasks[0]],
            tasks: [],
            contexts: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        await handleTaskDone(testTasks[0].id);

        const $todoistData = get(todoistData);
        const expectedDueDate = DateTime.now().plus({ minutes: 5 }).toJSDate().toISOString();
        expect($todoistData.dueTasks[0].due?.date).toBe(expectedDueDate);
    });

    it("calls markTaskDone with the correct task ID", async () => {
        await handleTaskDone(testTasks[0].id);
        expect(markTaskDone).toHaveBeenCalledWith(testTasks[0].id);
    });

    it("sets todoistError if markTaskDone fails", async () => {
        (markTaskDone as Mock).mockRejectedValue(new Error("API Error"));
        await handleTaskDone(testTasks[0].id);
        expect(get(todoistErrorMockStore)).toBe("Failed to mark task done: API Error");
    });

    it("calls refreshData if markTaskDone succeeds", async () => {
        (markTaskDone as Mock).mockResolvedValue({});
        await handleTaskDone(testTasks[0].id);
        expect(refreshData).toHaveBeenCalled();
    });

    it("does not call refreshData if markTaskDone fails", async () => {
        (markTaskDone as Mock).mockRejectedValue(new Error("API Error"));
        await handleTaskDone(testTasks[0].id);
        expect(refreshData).not.toHaveBeenCalled();
    });
});

describe("handleTaskDefer", () => {
    beforeEach(() => {
        resetStoreMocks();
        vi.clearAllMocks();
    });

    it("sets previousFirstDueTask to null", async () => {
        previousFirstDueTaskMockStore.set(testTasks[0]);
        await handleTaskDefer([[testTasks[0], DateTime.now()]]);
        expect(get(previousFirstDueTask)).toBeNull();
    });

    it("updates task resources with new due dates", async () => {
        todoistDataMockStore.set({
            dueTasks: [testTasks[0]],
            tasks: [],
            contexts: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        const newDueDate = DateTime.now().plus({ days: 1 });
        await handleTaskDefer([[testTasks[0], newDueDate]]);

        const $todoistData = get(todoistData);
        expect($todoistData.dueTasks[0].due?.date).toBe(newDueDate.toJSDate().toISOString());
    });

    it("calls deferTasks with the correct task updates", async () => {
        const newDueDate = DateTime.now().plus({ days: 1 });
        const taskUpdates: Array<[Task, DateTime]> = [[testTasks[0], newDueDate]];
        await handleTaskDefer(taskUpdates);
        expect(deferTasks).toHaveBeenCalledWith(taskUpdates);
    });

    it("sets todoistError if deferTasks fails", async () => {
        (deferTasks as Mock).mockRejectedValue(new Error("API Error"));
        await handleTaskDefer([[testTasks[0], DateTime.now()]]);
        expect(get(todoistErrorMockStore)).toBe("Failed to defer tasks: API Error");
    });

    it("calls refreshData if deferTasks succeeds", async () => {
        (deferTasks as Mock).mockResolvedValue({});
        await handleTaskDefer([[testTasks[0], DateTime.now()]]);
        expect(refreshData).toHaveBeenCalled();
    });

    it("does not call refreshData if deferTasks fails", async () => {
        (deferTasks as Mock).mockRejectedValue(new Error("API Error"));
        await handleTaskDefer([[testTasks[0], DateTime.now()]]);
        expect(refreshData).not.toHaveBeenCalled();
    });
});
