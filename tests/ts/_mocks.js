/**
 * Mocks must be defined/imported before any other imports!
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

import { vi } from "vitest";
