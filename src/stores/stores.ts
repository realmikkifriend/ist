import { DateTime } from "luxon";
import { resettablePersisted, resettableWritable, registerStore } from "./reset";
import type { TodoistData, Task, User } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type { ResettableStore } from "../types/interface";

/**
 * Stores Todoist data.
 */
export const todoistData = resettablePersisted<TodoistData>("todoist_data", {
    tasks: [],
    contexts: [],
    dueTasks: [],
    reverseTasks: { tomorrow: [], today: [] },
    user: {} as User,
});
registerStore(todoistData);

/**
 * Stores Todoist errors.
 */
export const todoistError: ResettableStore<string | null> = resettableWritable(null);
registerStore(todoistError);

/**
 * Stores the first due task.
 */
export const firstDueTask = resettablePersisted<Task | null>("firstDueTask", null);
registerStore(firstDueTask);

/**
 * Stores the previous first due task.
 */
export const previousFirstDueTask: ResettableStore<Task | null> = resettableWritable(null);
registerStore(previousFirstDueTask);

/**
 * Stores task activity.
 */
export const taskActivity = resettablePersisted<TaskActivity[]>("task_activity", [], {
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
registerStore(taskActivity);
