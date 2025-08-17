import type { DateTime } from "luxon";
import type {
    Task as BaseTask,
    PersonalProject,
    User as BaseUser,
    Comment as BaseComment,
} from "@doist/todoist-api-typescript";
import type { TaskActivity } from "./activity";

export type Context = PersonalProject;

export interface TodoistData {
    tasks: Task[];
    contexts: Context[];
    dueTasks: Task[];
    user: User;
    reverseTasks: {
        tomorrow: Task[];
        today: Task[];
    };
}

export interface CleanableTodoistData {
    tasks?: Task[];
    contexts?: Context[];
    user?: User;
    [key: string]: unknown;
}

export type Priority = 1 | 2 | 3 | 4;

export type ColorName =
    | "berry_red"
    | "red"
    | "orange"
    | "yellow"
    | "olive_green"
    | "lime_green"
    | "green"
    | "mint_green"
    | "teal"
    | "sky_blue"
    | "light_blue"
    | "blue"
    | "grape"
    | "violet"
    | "lavender"
    | "magenta"
    | "salmon"
    | "charcoal"
    | "grey"
    | "taupe";

export type Task = Omit<
    BaseTask,
    | "userId"
    | "sectionId"
    | "parentId"
    | "addedByUid"
    | "assignedByUid"
    | "responsibleUid"
    | "deadline"
    | "checked"
    | "description"
    | "isDeleted"
    | "addedAt"
    | "completedAt"
    | "duration"
    | "childOrder"
    | "updatedAt"
    | "noteCount"
    | "isCollapsed"
    | "dayOrder"
    | "projectId"
> & {
    projectId?: string;

    contextId?: string;
    summoned?: string | boolean;
    skip?: boolean;
    firstDue?: boolean;
    comments?: Comment[] | Promise<Comment[]>;
    activity?: TaskActivity[] | Promise<TaskActivity[]>;

    due: Due | null;
};
interface Due {
    allDay?: number;
    isRecurring: boolean;
    date: string;
    dateObject?: Date;
    datetime?: string | null | undefined;
    extractedTime?: { hour: number; minute: number } | null;
    lang?: string | null | undefined;
    string: string;
    timezone?: string | null | undefined;
}

export interface User extends BaseUser {
    tz_info?: {
        timezone?: string;
    };
    daily_goal: number;
}

export interface TasksGroupedByContext {
    [contextId: string]: {
        total: number;
        priorities: { [priority: number]: number };
        tasks: Task[];
    };
}

export interface ContextButtonProps {
    context: Context;
    tasksForContext: TasksGroupedByContext[string];
    isDisabled?: boolean;
}

export interface DueTasksData {
    tasks: Task[];
    contexts: Context[];
    user?: User;
}

export type TaskUpdates = Array<[string, Date | DateTime | string]>;

export type Comment = BaseComment;

export interface CommentsProps {
    commentsPromise: Promise<Comment[]>;
}

export interface ListTaskProps {
    task: Task;
}

export interface UpdateFirstDueTaskResult {
    task: Task | null;
    showNewTaskToast: boolean;
    doClearContext: boolean;
    dueTasks: Task[];
    updatedTodoistData?: TodoistData;
}

export interface InitialCheckOutcome {
    action: "continue" | "exit" | "set_task_and_exit" | "set_task_and_continue";
    taskToSet?: Task | null;
    showNewTaskToast?: boolean;
}

export type GetAllActivityDataParams = {
    timeframe: DateTime[];
    accumulatedData?: TaskActivity[];
    cursor?: string | null;
    task: Task | null;
    emptyResponsesCount?: number;
};
