import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import type { Mock } from "vitest";
import type { TodoistData, Task } from "../../types/todoist";
import type { UserSettings } from "../../types/interface";

// Mock @zerodevx/svelte-toast as in toasts.spec.ts
vi.mock("@zerodevx/svelte-toast", () => {
    const pop: Mock = vi.fn();
    const push: Mock = vi.fn();
    return {
        toast: {
            pop,
            push,
        },
    };
});

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
    // Minimal valid Task object for tests
    const mockTask: Task = {
        id: "1",
        content: "Test Task",
        projectId: "proj1",
        sectionId: null,
        parentId: null,
        priority: 1,
        url: "",
        due: null,
        labels: [],
        userId: "user1",
        description: "",
        isDeleted: false,
        responsibleUid: null,
        duration: null,
        addedByUid: null,
        assignedByUid: null,
        deadline: null,
        checked: false,
        addedAt: null,
        completedAt: null,
        updatedAt: null,
        childOrder: 0,
        noteCount: 0,
        dayOrder: 0,
        isCollapsed: false,
    };

    // Minimal valid selectedContext (PersonalProject)
    const mockContext = {
        id: "ctx1",
        name: "Context 1",
        url: "",
        parentId: null,
        isDeleted: false,
        updatedAt: null,
        childOrder: 0,
        description: "",
        isCollapsed: false,
        canAssignTasks: false,
        color: "berry_red",
        shared: false,
        syncId: null,
        teamInbox: false,
        inboxProject: false,
        order: 0,
        viewStyle: "list",
        defaultOrder: 0,
        isShared: false,
        createdAt: null,
        isArchived: false,
        isFavorite: false,
        isFrozen: false,
    };

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
