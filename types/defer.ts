import type { Priority } from "./todoist";

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
    count?: number | string;
    priority?: Priority;
    time?: string;
}

export interface DeferButtonConfig {
    tomorrow: TimeButtonConfig;
    minutes: TimeButtonConfig[];
    hours: TimeButtonConfig[];
}
