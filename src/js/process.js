import { DateTime } from "luxon";
import { createDateWithTime } from "./time";
import { handleTaskDefer } from "../js/taskHandlers";

function handleOverdueTasks(tasks) {
    const today = DateTime.now().startOf("day");
    const overdueTasks =
        tasks.filter((task) => {
            const dueDate = task.due?.date && DateTime.fromISO(task.due.date).startOf("day");
            return dueDate && dueDate < today;
        }) || [];

    if (overdueTasks.length > 0) {
        const taskUpdates = overdueTasks.map((task) => {
            const extracted = task.due?.string ? createDateWithTime(task.due.string, today) : null;
            const time = extracted?.newDate || today;
            return [task, time];
        });

        handleTaskDefer(taskUpdates);
    }
}

function cleanDataArray(dataArray, propsToRemove, renameMap = {}) {
    return dataArray.map((item) =>
        propsToRemove.reduce(
            (acc, prop) => {
                if (renameMap[prop] && acc[prop] !== undefined) {
                    acc[renameMap[prop]] = acc[prop];
                }
                delete acc[prop];
                return acc;
            },
            { ...item },
        ),
    );
}

export function cleanTodoistData(data) {
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
        data.tasks = cleanDataArray(data.tasks, taskPropsToRemove, taskRenameMap);
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
        data.contexts = cleanDataArray(data.contexts, contextPropsToRemove);
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

        data.user = cleanDataArray([data.user], userPropsToRemove)[0];
    }

    return data;
}
