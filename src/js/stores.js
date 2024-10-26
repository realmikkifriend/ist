import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";

export const todoistAccessToken = persisted("todoist_access_token", "");
export const todoistResources = persisted("todoist_resources", {});
export const todoistError = writable(null);
export const syncToken = writable(null);
export const userSettings = persisted("user_settings", {
    selectedContextId: null,
});
export const firstDueTask = persisted("firstDueTask", null);
export const previousFirstDueTask = writable(null);
export const dynalistAccessToken = persisted("dynalist_access_token", "");
