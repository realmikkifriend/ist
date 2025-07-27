import { vi } from "vitest";
import { writable, type Writable } from "svelte/store";
import type { TodoistData, Task } from "../../types/todoist";
import type { UserSettings } from "../../types/interface";

export const userSettingsMockStore: Writable<UserSettings> = writable({ selectedContext: null });
export const previousFirstDueTaskMockStore: Writable<Task | null> = writable(null);
export const todoistDataMockStore: Writable<TodoistData> = writable({
    dueTasks: [],
    tasks: [],
    contexts: [],
    reverseTasks: { tomorrow: [], today: [] },
});
export const firstDueTaskMockStore: Writable<Task | null> = writable(null);
export const todoistErrorMockStore: Writable<string | null> = writable(null);

export const userSettingsUpdateSpy = vi.spyOn(userSettingsMockStore, "update");
export const previousFirstDueTaskSetSpy = vi.spyOn(previousFirstDueTaskMockStore, "set");

vi.mock("../../src/js/stores", () => {
    return {
        userSettings: userSettingsMockStore,
        previousFirstDueTask: previousFirstDueTaskMockStore,
        todoistData: todoistDataMockStore,
        firstDueTask: firstDueTaskMockStore,
        todoistError: todoistErrorMockStore,
    };
});

/**
 * Resets the mocked stores.
 */
export function resetStoreMocks() {
    userSettingsMockStore.set({ selectedContext: null });
    previousFirstDueTaskMockStore.set(null);
    todoistDataMockStore.set({
        dueTasks: [],
        tasks: [],
        contexts: [],
        reverseTasks: { tomorrow: [], today: [] },
    });
    firstDueTaskMockStore.set(null);
    todoistErrorMockStore.set(null);

    userSettingsUpdateSpy.mockReset();
    previousFirstDueTaskSetSpy.mockReset();
}
