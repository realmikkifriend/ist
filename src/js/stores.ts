import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { DateTime } from "luxon";
import type { Writable } from "svelte/store";
import type { TodoistData, Task, TaskActivity, User } from "../../types/todoist";
import type { UserSettings, ToastMessage } from "../../types/interface";

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
    reverseTasks: { tomorrow: [], today: [] },
    user: {} as User,
});

/**
 * Stores Todoist errors.
 */
export const todoistError: Writable<string | null> = writable(null);

/**
 * Stores user settings.
 */
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
 * Stores task activity.
 */
export const taskActivity = persisted<TaskActivity[]>("task_activity", [], {
    serializer: {
        stringify: (value) =>
            JSON.stringify(
                value.map((activity) => ({
                    ...activity,
                    date: activity.date.toISO(),
                })),
            ),
        parse: (text) =>
            (JSON.parse(text) as (Omit<TaskActivity, "date"> & { date: string })[]).map(
                (activity) => ({
                    ...activity,
                    date: DateTime.fromISO(activity.date),
                }),
            ),
    },
});

/**
 * Stores toast messages.
 */
export const toastMessages = writable<ToastMessage[]>([]);

/**
 * Logs the user out by clearing all relevant stores and showing a toast.
 * @returns {void}
 */
export function handleLogout(): void {
    toastMessages.set([]);
    todoistAccessToken.set("");
    todoistData.set({
        tasks: [],
        contexts: [],
        dueTasks: [],
        reverseTasks: { tomorrow: [], today: [] },
        user: {} as User,
    });
    todoistError.set(null);
    firstDueTask.set(null);
    userSettings.set({ selectedContext: null });
    dynalistAccessToken.set("");
    taskActivity.set([]);
}
