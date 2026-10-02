import { DateTime } from "luxon";
import type { Task } from "../types/todoist";
import type { TaskActivity } from "../types/activity";
import type { LongestIdleTask } from "../types/stats";

/** Maximum number of entries in the longest-idle list. */
const LONGEST_IDLE_LIMIT = 10;

/**
 * Ranks tasks by how many days have passed since their last completion. Tasks
 * with no completion in the retrieved window rank first, labeled with the
 * window size as a lower bound. Never-done tasks (never-mark-done label) are
 * excluded, since they can never have a meaningful completion gap.
 * @param {Task[]} tasks - The open tasks to rank.
 * @param {TaskActivity[]} activities - The stored completion history.
 * @param {number} windowDays - Days of history covered by the retrieved window.
 * @param {DateTime} now - The reference moment.
 * @returns {LongestIdleTask[]} Ranked entries, longest idle first.
 */
export function getLongestIdleTasks(
    tasks: Task[],
    activities: TaskActivity[],
    windowDays: number,
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

    return tasks
        .filter((task) => !task.neverDone)
        .flatMap((task): LongestIdleTask[] => {
            const latest = latestByTask.get(task.id);
            return [
                {
                    taskId: task.id,
                    title: task.content,
                    contextId: task.contextId ?? task.projectId ?? "",
                    days: latest
                        ? Math.max(0, Math.floor(today.diff(latest.startOf("day"), "days").days))
                        : windowDays,
                    beyondWindow: !latest,
                },
            ];
        })
        .sort((a, b) => Number(b.beyondWindow) - Number(a.beyondWindow) || b.days - a.days)
        .slice(0, LONGEST_IDLE_LIMIT);
}
