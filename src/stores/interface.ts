import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import type { UserSettings, ToastMessage } from "../types/interface";

/**
 * Stores user settings.
 */
export const userSettings = persisted<UserSettings>("user_settings", {
    selectedContext: null,
});

/**
 * Stores toast messages.
 */
export const toastMessages = writable<ToastMessage[]>([]);
