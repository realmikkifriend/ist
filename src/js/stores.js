import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { toast } from "@zerodevx/svelte-toast";

export const todoistAccessToken = persisted("todoist_access_token", "");
export const todoistData = persisted("todoist_data", {});
export const todoistError = writable(null);
export const userSettings = persisted("user_settings", {
    selectedContext: null,
});
export const firstDueTask = persisted("firstDueTask", null);
export const previousFirstDueTask = writable(null);
export const dynalistAccessToken = persisted("dynalist_access_token", "");

export function handleLogout() {
    toast.pop(0);
    todoistAccessToken.set("");
    todoistData.set({});
    todoistError.set(null);
    firstDueTask.set(null);
    userSettings.set({ selectedContext: null });
    dynalistAccessToken.set("");
}
