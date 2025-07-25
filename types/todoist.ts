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
    reverseTasks: Task[];
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

export interface Task extends BaseTask {
    contextId?: string;
    summoned?: string | boolean;
    skip?: boolean;

    due: Due | null;
}
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
        name?: string;
    };
}

export interface DueTasksGroupedByContext {
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
