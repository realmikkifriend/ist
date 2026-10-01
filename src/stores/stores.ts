import { DateTime } from "luxon";
import { resettablePersisted, resettableWritable, registerStore } from "./reset";
import type { TodoistData, Task, User } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type { StatsHistoryWindow } from "../types/stats";
import type { ResettableStore } from "../types/interface";

/**
 * Stores Todoist data.
 */
export const todoistData = resettablePersisted<TodoistData>("todoist_data", {
    tasks: [],
    contexts: [],
    dueTasks: [],
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
export const displayTask = resettablePersisted<Task | null>("displayTask", null);
registerStore(displayTask);

/**
 * Stores the previous first due task.
 */
export const previousDisplayTask: ResettableStore<Task | null> = resettableWritable(null);
registerStore(previousDisplayTask);

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

/**
 * Stores the completion-history range (oldest/newest local ISO dates)
 * retrieved by the stats view.
 */
export const statsHistoryWindow = resettablePersisted<StatsHistoryWindow | null>(
    "stats_history_window",
    null,
);
registerStore(statsHistoryWindow);
