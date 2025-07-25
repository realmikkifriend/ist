import { createDateWithTime } from "./time";
import { handleTaskDefer } from "./taskHandlers";
import { DateTime } from "luxon";
import type { Task, Context, User, CleanableTodoistData } from "../../types/todoist";

/**
 * Handles overdue tasks by deferring them to today.
 * @param {Task[]} tasks - Array of Task objects to check for overdue status.
 * @returns {void}
 */
function handleOverdueTasks(tasks: Task[]): void {
    const today = DateTime.now().startOf("day");
    const overdueTasks =
        tasks.filter((task) => {
            const dueDate = task.due?.date && DateTime.fromISO(task.due.date).startOf("day");
            return dueDate && dueDate < today;
        }) || [];

    if (overdueTasks.length > 0) {
        const taskUpdates: [Task, DateTime][] = overdueTasks.map((task) => {
            const extracted = task.due?.string ? createDateWithTime(task.due.string, today) : null;
            const time = extracted?.newDate || today;
            return [task, time];
        });

        void handleTaskDefer(taskUpdates);
    }
}

/**
 * Removes specified properties from each object in the array and optionally renames properties.
 * @template T
 * @param {T[]} dataArray - Array of objects to clean.
 * @param {string[]} propsToRemove - Properties to remove from each object.
 * @param {Record<string, string>} renameMap - Map of properties to rename (oldName: newName).
 * @returns {Partial<T>[]} - Array of cleaned objects.
 */
function cleanDataArray<T extends object>(
    dataArray: T[],
    propsToRemove: string[],
    renameMap: Record<string, string> = {},
): Partial<T>[] {
    return dataArray.map((item) => {
        const result: Partial<T> = { ...item };
        return propsToRemove.reduce((acc, prop) => {
            if (Object.prototype.hasOwnProperty.call(acc, prop)) {
                if (renameMap[prop]) {
                    (acc as Record<string, unknown>)[renameMap[prop]] = (
                        acc as Record<string, unknown>
                    )[prop];
                }
                delete (acc as Record<string, unknown>)[prop];
            }
            return acc;
        }, result);
    });
}

/**
 * Cleans Todoist data by removing unnecessary properties and renaming as needed.
 * @param {CleanableTodoistData} data - The Todoist data object to clean.
 * @returns {CleanableTodoistData} - The cleaned data object.
 */
export function cleanTodoistData(data: CleanableTodoistData): CleanableTodoistData {
    if (data.tasks) {
        handleOverdueTasks(data.tasks);
        const taskPropsToRemove = [
            "userId",
            "sectionId",
            "parentId",
            "addedByUid",
            "assignedByUid",
            "responsibleUid",
            "deadline",
            "checked",
            "description",
            "isDeleted",
            "addedAt",
            "completedAt",
            "updatedAt",
            "noteCount",
            "isCollapsed",
            "dayOrder",
            "projectId",
        ];
        const taskRenameMap = {
            projectId: "contextId",
        };
        data.tasks = cleanDataArray(
            data.tasks,
            taskPropsToRemove,
            taskRenameMap,
        ) as unknown as Task[];
    }

    if (data.contexts) {
        const contextPropsToRemove = [
            "canAssignTasks",
            "createdAt",
            "isArchived",
            "isDeleted",
            "isFavorite",
            "isFrozen",
            "updatedAt",
            "viewStyle",
            "defaultOrder",
            "description",
            "isCollapsed",
            "isShared",
            "parentId",
        ];
        data.contexts = cleanDataArray(data.contexts, contextPropsToRemove) as unknown as Context[];
    }

    if (data.user) {
        const userPropsToRemove = [
            "activated_user",
            "auto_reminder",
            "avatar_big",
            "avatar_medium",
            "avatar_s640",
            "avatar_small",
            "business_account_id",
            "completed_count",
            "date_format",
            "deleted_at",
            "feature_identifier",
            "features",
            "has_magic_number",
            "has_password",
            "has_started_a_trial",
            "image_id",
            "id",
            "inbox_project_id",
            "is_celebrations_enabled",
            "is_deleted",
            "is_premium",
            "joinable_workspace",
            "joined_at",
            "karma",
            "karma_trend",
            "lang",
            "mfa_enabled",
            "onboarding_level",
            "onboarding_persona",
            "onboarding_role",
            "onboarding_started",
            "onboarding_team_mode",
            "onboarding_use_cases",
            "premium_status",
            "premium_until",
            "shard_id",
            "share_limit",
            "sort_order",
            "start_day",
            "start_page",
            "theme_id",
            "time_format",
            "unique_prefix",
            "verification_status",
            "websocket_url",
            "weekend_start_day",
        ];

        data.user = cleanDataArray([data.user], userPropsToRemove)[0] as unknown as User;
    }

    return data;
}
