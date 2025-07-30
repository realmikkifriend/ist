import type { DateTime } from "luxon";
import type {
    Task as BaseTask,
    PersonalProject,
    User as BaseUser,
    Comment as BaseComment,
} from "@doist/todoist-api-typescript";

export type Context = PersonalProject;

export type Comment = BaseComment;

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
    comments?: Comment[];

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
    };
}

export interface DueTasksData {
    tasks: Task[];
    contexts: Context[];
    user?: User;
}

export type TaskUpdates = Array<[string, Date | DateTime | string]>;

export interface TaskActivity {
    date: DateTime;
    taskId: string;
    contextId: string;
    title: string;
}

export interface TodoistActivity {
    event_date: string;
    object_id: string;
    parent_project_id: string;
    extra_data: {
        content: string;
    };
}
