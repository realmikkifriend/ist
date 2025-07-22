import type { Task as BaseTask, PersonalProject } from "@doist/todoist-api-typescript";

export type Context = PersonalProject;

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
}

export interface DueTasksGroupedByContext {
    [contextId: string]: {
        total: number;
        priorities: { [priority: number]: number };
    };
}
