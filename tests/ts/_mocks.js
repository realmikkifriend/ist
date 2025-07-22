import { vi } from "vitest";

function createMockStore(initial) {
    let value = initial;
    return {
        set: vi.fn((v) => {
            value = v;
        }),
        update: vi.fn((fn) => {
            value = fn(value);
        }),
        subscribe: (fn) => {
            fn(value);
            return () => {};
        },
        _get: () => value,
    };
}

// --- svelte-persisted-store ---
vi.mock("svelte-persisted-store", () => ({
    persisted: vi.fn((key, initial) => createMockStore(initial)),
}));

// --- svelte/store ---
export const get = vi.fn();
vi.mock("svelte/store", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        get,
        writable: vi.fn((initial) => createMockStore(initial)),
    };
});

// --- @zerodevx/svelte-toast ---
const pop = vi.fn();
vi.mock("@zerodevx/svelte-toast", () => ({
    toast: { pop },
    __popMock: pop,
}));

// --- ../../src/js/first.js ---
export const updateFirstDueTaskMock = vi.fn();
vi.mock("../../src/js/first.js", () => ({
    updateFirstDueTask: updateFirstDueTaskMock,
}));

// --- ../../src/js/stores ---
export const todoistAccessToken = createMockStore("");
export const dynalistAccessToken = createMockStore("");
export const todoistData = createMockStore({
    tasks: [],
    contexts: [],
    dueTasks: [],
    reverseTasks: [],
});
export const todoistError = createMockStore(null);
export const userSettings = createMockStore({ selectedContext: null });
export const firstDueTask = createMockStore(null);
export const previousFirstDueTask = createMockStore(null);
export const handleLogout = vi.fn();

export const stores = {
    todoistAccessToken,
    dynalistAccessToken,
    todoistData,
    todoistError,
    userSettings,
    firstDueTask,
    previousFirstDueTask,
    handleLogout,
};

vi.mock("../../src/js/stores", () => ({ ...stores }));
