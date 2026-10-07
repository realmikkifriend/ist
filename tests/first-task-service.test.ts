import { afterEach, describe, expect, it, vi } from "vitest";
import { updateDisplayTask, debounceState } from "../src/services/firstTaskService";
import { todoistData, previousDisplayTask } from "../src/stores/stores";
import { getTaskComments } from "../src/utils/apiUtils";
import { getActivity } from "../src/services/activityService";
import type { Comment, Task, User } from "../src/types/todoist";

// Enrichment network calls are stubbed out: the tests assert whether they run.
vi.mock("../src/utils/apiUtils", () => ({
    getTaskComments: vi.fn().mockResolvedValue([]),
}));

vi.mock("../src/services/activityService", () => ({
    getActivity: vi.fn().mockReturnValue({ data: [], promise: null }),
}));

/**
 * Builds a minimal task object for store seeding.
 * @param {string} id - The task id.
 * @param {string} content - The task content.
 * @returns {Task} The task.
 */
function makeTask(id: string, content: string): Task {
    return {
        id,
        content,
        priority: 4,
        projectId: "",
        due: { isRecurring: false, date: "2026-10-07", string: "2026-10-07" },
    } as Task;
}

/**
 * Seeds the todoistData store with a single due task.
 * @param {Task} dueTask - The due task to seed.
 * @returns {void} Nothing.
 */
function seedData(dueTask: Task): void {
    todoistData.set({
        tasks: [dueTask],
        contexts: [],
        dueTasks: [dueTask],
        user: {} as User,
    });
}

describe("updateDisplayTask enrichment", () => {
    afterEach(() => {
        vi.clearAllMocks();
        debounceState.clearDebounceTimeout();
        previousDisplayTask.set(null);
        todoistData.set({ tasks: [], contexts: [], dueTasks: [], user: {} as User });
    });

    it("reuses the previous task when the first-due task is unchanged", async () => {
        const cachedComments = [{ id: "c1", content: "cached comment" } as Comment];
        const previous = { ...makeTask("task-1", "Alpha"), comments: cachedComments };
        // The refreshed copy is a new object with the same id (new wire data).
        seedData(makeTask("task-1", "Alpha"));
        previousDisplayTask.set(previous);

        const result = await updateDisplayTask();

        // feature: "A refresh does not re-enrich an unchanged displayed task"
        expect(result.task).toBe(previous);
        expect(result.showNewTaskToast).toBe(false);
        expect(getTaskComments).not.toHaveBeenCalled();
        expect(getActivity).not.toHaveBeenCalled();
    });

    it("re-enriches when the first-due task changes", async () => {
        seedData(makeTask("task-1", "Alpha"));
        const prevTask = makeTask("task-2", "Beta");
        previousDisplayTask.set(prevTask);

        const result = await updateDisplayTask();

        expect(result.task).not.toBeNull();
        expect(result.task).not.toBe(prevTask);
        expect(result.showNewTaskToast).toBe(true);
        expect(getTaskComments).toHaveBeenCalledWith(expect.any(String), "task-1");
    });
});
