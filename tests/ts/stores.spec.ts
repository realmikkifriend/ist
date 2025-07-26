import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "svelte/store";
import type { TodoistData } from "../../types/todoist";
import type { UserSettings } from "../../types/interface";
import "../../tests/helpers/mockToast";
import { mockTask, mockContext } from "../helpers/testData";

import { toast } from "@zerodevx/svelte-toast";
import {
    todoistAccessToken,
    dynalistAccessToken,
    todoistData,
    todoistError,
    userSettings,
    firstDueTask,
    previousFirstDueTask,
    handleLogout,
} from "../../src/js/stores";

describe("stores", () => {
    beforeEach(() => {
        todoistAccessToken.set("");
        dynalistAccessToken.set("");
        todoistData.set({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        todoistError.set(null);
        userSettings.set({ selectedContext: null });
        firstDueTask.set(null);
        previousFirstDueTask.set(null);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should have correct initial values", () => {
        expect(get(todoistAccessToken)).toBe("");
        expect(get(dynalistAccessToken)).toBe("");
        expect(get(todoistData)).toEqual({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        expect(get(todoistError)).toBe(null);
        expect(get(userSettings)).toEqual({ selectedContext: null });
        expect(get(firstDueTask)).toBe(null);
        expect(get(previousFirstDueTask)).toBe(null);
    });

    it("should update store values", () => {
        todoistAccessToken.set("abc");
        expect(get(todoistAccessToken)).toBe("abc");

        dynalistAccessToken.set("xyz");
        expect(get(dynalistAccessToken)).toBe("xyz");

        const data: TodoistData = {
            tasks: [mockTask],
            contexts: [mockContext],
            dueTasks: [mockTask],
            reverseTasks: { tomorrow: [mockTask], today: [mockTask] },
        };
        todoistData.set(data);
        expect(get(todoistData)).toEqual(data);

        todoistError.set("err");
        expect(get(todoistError)).toBe("err");

        const settings: UserSettings = { selectedContext: mockContext };
        userSettings.set(settings);
        expect(get(userSettings)).toEqual(settings);

        firstDueTask.set(mockTask);
        expect(get(firstDueTask)).toEqual(mockTask);

        previousFirstDueTask.set(mockTask);
        expect(get(previousFirstDueTask)).toEqual(mockTask);
    });

    it("handleLogout resets all stores and calls toast.pop", () => {
        todoistAccessToken.set("token");
        dynalistAccessToken.set("token2");
        todoistData.set({
            tasks: [mockTask],
            contexts: [mockContext],
            dueTasks: [mockTask],
            reverseTasks: { tomorrow: [mockTask], today: [mockTask] },
        });
        todoistError.set("err");
        userSettings.set({ selectedContext: mockContext });
        firstDueTask.set(mockTask);

        handleLogout();

        expect(toast.pop).toHaveBeenCalledWith(0);
        expect(get(todoistAccessToken)).toBe("");
        expect(get(dynalistAccessToken)).toBe("");
        expect(get(todoistData)).toEqual({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: { tomorrow: [], today: [] },
        });
        expect(get(todoistError)).toBe(null);
        expect(get(userSettings)).toEqual({ selectedContext: null });
        expect(get(firstDueTask)).toBe(null);
    });
});
