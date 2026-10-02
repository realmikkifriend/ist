import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type { LongestIdleTask } from "../types/stats";

/** Maximum number of entries in the longest-idle list. */
const LONGEST_IDLE_LIMIT = 10;

/**
 * Ranks open tasks by how many days have passed since their last completion,
 * excluding tasks with no stored completions.
 * @param {Task[]} tasks - The open tasks to rank.
 * @param {TaskActivity[]} activities - The stored completion history.
 * @param {DateTime} now - The reference moment.
 * @returns {LongestIdleTask[]} Ranked entries, longest idle first.
 */
export function getLongestIdleTasks(
    tasks: Task[],
    activities: TaskActivity[],
    now: DateTime = DateTime.now(),
): LongestIdleTask[] {
    const latestByTask = new Map<string, DateTime>();
    activities.forEach((activity) => {
        const latest = latestByTask.get(activity.taskId);
        if (!latest || activity.date > latest) {
            latestByTask.set(activity.taskId, activity.date);
        }
    });

    const today = now.startOf("day");
    const ranked = tasks.flatMap((task) => {
        const latest = latestByTask.get(task.id);
        if (!latest) {
            return [];
        }
        return [
            {
                taskId: task.id,
                title: task.content,
                contextId: task.contextId ?? task.projectId ?? "",
                days: Math.max(0, Math.floor(today.diff(latest.startOf("day"), "days").days)),
            },
        ];
    });

    return ranked.sort((a, b) => b.days - a.days).slice(0, LONGEST_IDLE_LIMIT);
}
