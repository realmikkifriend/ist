import type { Priority, Task } from "./todoist";

export interface ButtonConfig {
    value?: number;
    height?: string;
    text?: string;
    ms?: number;
    styling?: string;
    stylingButton?: string;
}

export type TimeButtonConfig = ButtonConfig;

export interface DateButtonConfig extends ButtonConfig {
    priority?: Priority;
    time?: string;
    tasks?: Task[];
}

export interface DeferButtonConfig {
    tomorrow: TimeButtonConfig;
    minutes: TimeButtonConfig[];
    hours: TimeButtonConfig[];
}
