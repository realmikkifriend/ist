import { writable, Writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { toast } from "@zerodevx/svelte-toast";
import type { TodoistData } from "../../types/todoist";
import type { Task } from "@doist/todoist-api-typescript";

/**
 * Stores the Todoist access token.
 */
export const todoistAccessToken = persisted<string>("todoist_access_token", "");

/**
 * Stores the Dynalist access token.
 */
export const dynalistAccessToken = persisted<string>("dynalist_access_token", "");

/**
 * Stores Todoist data.
 */
export const todoistData = persisted<TodoistData>("todoist_data", {
    tasks: [],
    contexts: [],
    dueTasks: [],
    reverseTasks: [],
});

/**
 * Stores Todoist errors.
 */
export const todoistError: Writable<string | null> = writable(null);

/**
 * Stores user settings.
 */
export interface UserSettings {
    selectedContext: string | null;
}
export const userSettings = persisted<UserSettings>("user_settings", {
    selectedContext: null,
});

/**
 * Stores the first due task.
 */
export const firstDueTask = persisted<Task | null>("firstDueTask", null);

/**
 * Stores the previous first due task.
 */
export const previousFirstDueTask: Writable<Task | null> = writable(null);

/**
 * Logs the user out by clearing all relevant stores and showing a toast.
 * @returns {void}
 */
export function handleLogout(): void {
    toast.pop(0);
    todoistAccessToken.set("");
    todoistData.set({
        tasks: [],
        contexts: [],
        dueTasks: [],
        reverseTasks: [],
    });
    todoistError.set(null);
    firstDueTask.set(null);
    userSettings.set({ selectedContext: null });
    dynalistAccessToken.set("");
}
