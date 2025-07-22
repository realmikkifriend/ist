/**
 * Mocks must be defined/imported before any other imports!
 */

// --- svelte-persisted-store ---
vi.mock("svelte-persisted-store", () => ({
    persisted: vi.fn((key, initial) => {
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
    }),
}));

// --- svelte/store ---
export const get = vi.fn();
vi.mock("svelte/store", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        get,
        writable: vi.fn((initial) => {
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
        }),
    };
});

// --- @zerodevx/svelte-toast ---
vi.mock("@zerodevx/svelte-toast", () => {
    const pop = vi.fn();
    return {
        toast: { pop },
        __popMock: pop,
    };
});

// --- ../../src/js/first.js ---
export const updateFirstDueTaskMock = vi.fn();
vi.mock("../../src/js/first.js", () => ({
    updateFirstDueTask: updateFirstDueTaskMock,
}));

// --- ../../src/js/stores ---
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

vi.mock("../../src/js/stores", () => ({
    todoistAccessToken,
    dynalistAccessToken,
    todoistData,
    todoistError,
    userSettings,
    firstDueTask,
    previousFirstDueTask,
    handleLogout,
}));

// Place imports at the end to avoid hoisting errors
import { vi } from "vitest";
