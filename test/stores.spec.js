// test/stores.spec.js

/**
 * Mocks must be defined before any imports!
 */
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
vi.mock("svelte/store", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
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
vi.mock("@zerodevx/svelte-toast", () => {
    const pop = vi.fn();
    return {
        toast: { pop },
        __popMock: pop,
    };
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    todoistAccessToken,
    dynalistAccessToken,
    todoistData,
    todoistError,
    userSettings,
    firstDueTask,
    previousFirstDueTask,
    handleLogout,
} from "../src/js/stores";
import { __popMock as popMock } from "@zerodevx/svelte-toast";

describe("stores", () => {
    beforeEach(() => {
        todoistAccessToken.set("");
        dynalistAccessToken.set("");
        todoistData.set({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: [],
        });
        todoistError.set(null);
        userSettings.set({ selectedContext: null });
        firstDueTask.set(null);
        previousFirstDueTask.set(null);
        popMock.mockClear();
    });

    it("should have correct initial values", () => {
        expect(todoistAccessToken._get()).toBe("");
        expect(dynalistAccessToken._get()).toBe("");
        expect(todoistData._get()).toEqual({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: [],
        });
        expect(todoistError._get()).toBe(null);
        expect(userSettings._get()).toEqual({ selectedContext: null });
        expect(firstDueTask._get()).toBe(null);
        expect(previousFirstDueTask._get()).toBe(null);
    });

    it("should update store values", () => {
        todoistAccessToken.set("abc");
        expect(todoistAccessToken._get()).toBe("abc");

        dynalistAccessToken.set("xyz");
        expect(dynalistAccessToken._get()).toBe("xyz");

        todoistData.set({ tasks: [1], contexts: [2], dueTasks: [3], reverseTasks: [4] });
        expect(todoistData._get()).toEqual({
            tasks: [1],
            contexts: [2],
            dueTasks: [3],
            reverseTasks: [4],
        });

        todoistError.set("err");
        expect(todoistError._get()).toBe("err");

        userSettings.set({ selectedContext: "ctx" });
        expect(userSettings._get()).toEqual({ selectedContext: "ctx" });

        firstDueTask.set({ id: 1 });
        expect(firstDueTask._get()).toEqual({ id: 1 });

        previousFirstDueTask.set({ id: 2 });
        expect(previousFirstDueTask._get()).toEqual({ id: 2 });
    });

    it("handleLogout resets all stores and calls toast.pop", () => {
        todoistAccessToken.set("token");
        dynalistAccessToken.set("token2");
        todoistData.set({ tasks: [1], contexts: [2], dueTasks: [3], reverseTasks: [4] });
        todoistError.set("err");
        userSettings.set({ selectedContext: "ctx" });
        firstDueTask.set({ id: 1 });

        handleLogout();

        expect(popMock).toHaveBeenCalledWith(0);
        expect(todoistAccessToken._get()).toBe("");
        expect(dynalistAccessToken._get()).toBe("");
        expect(todoistData._get()).toEqual({
            tasks: [],
            contexts: [],
            dueTasks: [],
            reverseTasks: [],
        });
        expect(todoistError._get()).toBe(null);
        expect(userSettings._get()).toEqual({ selectedContext: null });
        expect(firstDueTask._get()).toBe(null);
    });
});
