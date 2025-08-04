import { writable } from "svelte/store";
import { persisted } from "svelte-persisted-store";
import { DateTime } from "luxon";
import type { Writable } from "svelte/store";
import type { TodoistData, Task, User } from "../types/todoist";
import type { TaskActivity } from "../types/activity";

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
