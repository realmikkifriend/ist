import { vi } from "vitest";
import { writable } from "svelte/store";

export const userSettingsMockStore = writable({ selectedContext: null });
export const previousFirstDueTaskMockStore = writable(null);
export const todoistDataMockStore = writable({ dueTasks: [] });
export const firstDueTaskMockStore = writable(null);

export const userSettingsUpdateSpy = vi.spyOn(userSettingsMockStore, "update");
export const previousFirstDueTaskSetSpy = vi.spyOn(previousFirstDueTaskMockStore, "set");

vi.mock("../../src/js/stores", () => {
    return {
        userSettings: userSettingsMockStore,
        previousFirstDueTask: previousFirstDueTaskMockStore,
        todoistData: todoistDataMockStore,
        firstDueTask: firstDueTaskMockStore,
    };
});

/**
 * Resets the mocked stores.
 */
export function resetStoreMocks() {
    userSettingsMockStore.set({ selectedContext: null });
    previousFirstDueTaskMockStore.set(null);
    todoistDataMockStore.set({ dueTasks: [] });
    firstDueTaskMockStore.set(null);

    userSettingsUpdateSpy.mockReset();
    previousFirstDueTaskSetSpy.mockReset();
}
