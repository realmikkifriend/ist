import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import type { ResettableStore } from "../types/interface";

/**
 * Creates a resettable writable store.
 * @param {T} initialValue - The value with which to instantiate the store.
 * @returns A resettable writable store.
 */
export function resettableWritable<T>(initialValue: T): ResettableStore<T> {
    const { subscribe, set, update } = writable<T>(initialValue);
    return {
        subscribe,
        set,
        update,
        reset: () => set(initialValue),
    };
}

/**
 * Creates a resettable persisted store.
 * @param {string} key - The key of the new store.
 * @param {T} initialValue - The value with which to instantiate the store.
 * @param {Parameters<typeof persisted<T>>[2]} options - The store's options.
 * @returns A resettable persisted store.
 */
export function resettablePersisted<T>(
    key: string,
    initialValue: T,
    options?: Parameters<typeof persisted<T>>[2],
): ResettableStore<T> {
    const { subscribe, set, update } = persisted<T>(key, initialValue, options);
    return {
        subscribe,
        set,
        update,
        reset: () => {
            set(initialValue);
            if (typeof window !== "undefined") {
                localStorage.removeItem(key);
            }
        },
    };
}

const stores: ResettableStore<unknown>[] = [];

/**
 * Registers new stores.
 * @param {ResettableStore<T>} store - The store to register.
 */
export function registerStore<T>(store: ResettableStore<T>): void {
    stores.push(store);
}

/**
 * Resets all stores.
 */
export function resetAllStores(): void {
    stores.forEach((store) => store.reset());
}
