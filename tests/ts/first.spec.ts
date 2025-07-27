import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { get } from "svelte/store";
import { getContextName, setFirstDueTask, skipTask, updateFirstDueTask } from "../../src/js/first";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../../src/js/stores";
import * as toasts from "../../src/js/toasts";
import * as api from "../../src/js/api";
import * as agenda from "../../src/html/agenda/agenda";
import * as sidebar from "../../src/html/sidebar/sidebar";
import { toast } from "@zerodevx/svelte-toast";
import { mockTask } from "../helpers/testData";
import { mockWindowLocation } from "../helpers/mockWindowLocation";
import { resetStoreMocks } from "../helpers/mockStores";
import type { TodoistData, Comment, Context } from "../../types/todoist";
import type { UserSettings } from "../../types/interface";

const mockSettings: UserSettings = {
    selectedContext: null,
};

const mockTodoistData: TodoistData = {
    dueTasks: [],
    tasks: [],
    contexts: [],
    reverseTasks: { today: [], tomorrow: [] },
};

const mockComment: Comment = {
    id: "1",
    content: "Test Comment",
    postedAt: "2025-07-27T10:00:00Z",
    taskId: "1",
    fileAttachment: null,
    isDeleted: false,
    postedUid: "1",
    uidsToNotify: [],
    reactions: {},
};

vi.mock("@zerodevx/svelte-toast", () => ({
    toast: {
        pop: vi.fn(),
    },
}));

vi.mock("../../src/js/toasts", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        success: vi.fn(),
        newFirstTask: vi.fn(),
    };
});

vi.mock("../../src/js/api", () => ({
    getTaskComments: vi.fn(),
}));

vi.mock("../../src/html/agenda/agenda", () => ({
    summonTask: vi.fn(),
}));

vi.mock("../../src/html/sidebar/sidebar", () => ({
    handleBadgeClick: vi.fn(),
}));

describe("first.ts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStoreMocks();
        todoistData.set({ ...mockTodoistData });
        userSettings.set({ ...mockSettings });
    });

    describe("getContextName", () => {
        it("returns selected context name from user settings if available", () => {
            const settingsWithContext = {
                ...mockSettings,
                selectedContext: { id: "1", name: "Work" },
            };
            userSettings.set(settingsWithContext);
            expect(getContextName()).toBe("Work");
        });

        it("returns context name from first due task if not in user settings", () => {
            const taskWithContext = { ...mockTask, contextId: "20" };
            firstDueTask.set(taskWithContext);
            const mockContext: Context = {
                id: "20",
                name: "Personal",
                color: "red",
                isFavorite: false,
                isDeleted: false,
                isArchived: false,
                childOrder: 0,
                isCollapsed: false,
                isShared: false,
                viewStyle: "list",
                parentId: null,
                url: "",
                canAssignTasks: false,
                createdAt: "",
                defaultOrder: 0,
                description: "",
                inboxProject: false,
                isFrozen: false,
                updatedAt: "",
            };
            const dataWithContext: TodoistData = {
                ...mockTodoistData,
                contexts: [mockContext],
            };
            todoistData.set(dataWithContext);
            userSettings.set({ ...mockSettings, selectedContext: null });

            expect(getContextName()).toBe("Personal");
        });

        it("returns an empty string if context cannot be found", () => {
            firstDueTask.set(mockTask);
            userSettings.set({ ...mockSettings, selectedContext: null });
            todoistData.set({ ...mockTodoistData, contexts: [] });
            expect(getContextName()).toBe("");
        });
    });

    describe("setFirstDueTask", () => {
        it("sets the firstDueTask and previousFirstDueTask stores", () => {
            setFirstDueTask(mockTask);
            expect(get(firstDueTask)).toEqual(mockTask);
            expect(get(previousFirstDueTask)).toEqual(mockTask);
        });

        it("sets the stores to null if task is null", () => {
            setFirstDueTask(null);
            expect(get(firstDueTask)).toBeNull();
            expect(get(previousFirstDueTask)).toBeNull();
        });
    });

    describe("skipTask", () => {
        const todayTask1 = { ...mockTask, id: "1", summoned: "#today" };
        const todayTask2 = { ...mockTask, id: "2", summoned: "#today" };
        const tomorrowTask1 = { ...mockTask, id: "3", summoned: "#tomorrow" };

        beforeEach(() => {
            const data = {
                ...mockTodoistData,
                reverseTasks: {
                    today: [todayTask1, todayTask2],
                    tomorrow: [tomorrowTask1],
                },
            };
            todoistData.set(data);
        });

        it("summons the next task in the same list", () => {
            skipTask(todayTask1);
            expect(agenda.summonTask).toHaveBeenCalledWith(todayTask2, true);
        });

        it("calls handleBadgeClick if it is the last task in the list", () => {
            skipTask(todayTask2);
            expect(sidebar.handleBadgeClick).toHaveBeenCalled();
        });

        it("works correctly for tomorrow's tasks", () => {
            skipTask(tomorrowTask1);
            expect(sidebar.handleBadgeClick).toHaveBeenCalled();
        });
    });

    describe("updateFirstDueTask", () => {
        let restoreWindowLocation: () => void;

        beforeEach(() => {
            restoreWindowLocation = mockWindowLocation({ hash: "#inbox" });
        });

        afterEach(() => {
            restoreWindowLocation();
        });

        it("sets first due task to null if there are no due tasks", async () => {
            todoistData.set({ ...mockTodoistData, dueTasks: [] });
            await updateFirstDueTask();
            expect(get(firstDueTask)).toBeNull();
        });

        it("sets the first due task and fetches its comments", async () => {
            const dueTasks = [{ ...mockTask, id: "1" }];
            todoistData.set({ ...mockTodoistData, dueTasks });
            vi.mocked(api.getTaskComments).mockResolvedValue([mockComment]);

            await updateFirstDueTask();

            const task = get(firstDueTask);
            expect(task).not.toBeNull();
            expect(task?.id).toBe("1");
            expect(task?.comments).toEqual([mockComment]);
            expect(api.getTaskComments).toHaveBeenCalledWith("1");
        });

        it("filters tasks by selected context", async () => {
            const dueTasks = [
                { ...mockTask, id: "1", contextId: "ctx1" },
                { ...mockTask, id: "2", contextId: "ctx2" },
            ];
            userSettings.set({
                ...mockSettings,
                selectedContext: { id: "ctx2", name: "Context 2" },
            });
            todoistData.set({ ...mockTodoistData, dueTasks });
            vi.mocked(api.getTaskComments).mockResolvedValue([]);

            await updateFirstDueTask();

            expect(get(firstDueTask)?.id).toBe("2");
        });

        it("resets context and shows all tasks if no tasks match context", async () => {
            const dueTasks = [{ ...mockTask, id: "1", contextId: "ctx1" }];
            userSettings.set({
                ...mockSettings,
                selectedContext: { id: "ctx2", name: "Context 2" },
            });
            todoistData.set({ ...mockTodoistData, dueTasks });
            vi.mocked(api.getTaskComments).mockResolvedValue([]);

            await updateFirstDueTask();

            expect(get(userSettings).selectedContext).toBeNull();
            expect(toasts.success).toHaveBeenCalledWith(
                "No more tasks in context! Showing all due tasks...",
            );
            expect(get(firstDueTask)?.id).toBe("1");
        });

        it("calls newFirstTask when a new task arrives and conditions are met", async () => {
            const prevTask = { ...mockTask, id: "prev" };
            const newTask = { ...mockTask, id: "new" };
            previousFirstDueTask.set(prevTask);
            todoistData.set({ ...mockTodoistData, dueTasks: [newTask] });
            vi.mocked(api.getTaskComments).mockResolvedValue([]);

            await updateFirstDueTask();

            expect(toasts.newFirstTask).toHaveBeenCalled();
            expect(toast.pop).not.toHaveBeenCalled();
            const callback = vi.mocked(toasts.newFirstTask).mock.calls[0][1];
            callback();
            expect(get(firstDueTask)?.id).toBe("new");
        });

        it("calls setFirstDueTask directly when a new task arrives but conditions are not met", async () => {
            const restoreHash = mockWindowLocation({ hash: "#today" });
            const prevTask = { ...mockTask, id: "prev" };
            const newTask = { ...mockTask, id: "new" };
            previousFirstDueTask.set(prevTask);
            todoistData.set({ ...mockTodoistData, dueTasks: [newTask] });
            vi.mocked(api.getTaskComments).mockResolvedValue([]);

            await updateFirstDueTask();

            expect(toasts.newFirstTask).not.toHaveBeenCalled();
            expect(toast.pop).toHaveBeenCalledWith({ target: "wait" });
            expect(get(firstDueTask)?.id).toBe("new");
            restoreHash();
        });

        it("calls setFirstDueTask directly when the task is the same", async () => {
            const task = { ...mockTask, id: "same" };
            previousFirstDueTask.set(task);
            todoistData.set({ ...mockTodoistData, dueTasks: [task] });
            vi.mocked(api.getTaskComments).mockResolvedValue([]);

            await updateFirstDueTask();

            expect(toasts.newFirstTask).not.toHaveBeenCalled();
            expect(toast.pop).toHaveBeenCalledWith({ target: "wait" });
            expect(get(firstDueTask)?.id).toBe("same");
        });
    });
});
