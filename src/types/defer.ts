import type { Priority, Task } from "./todoist";

export interface ButtonConfig {
    value?: number;
    height?: string;
    text?: string;
    ms?: number;
    styling?: string;
    stylingButton?: string;
}

export interface DateButtonConfig extends ButtonConfig {
    priority?: Priority;
    time?: string;
    tasks?: Task[];
}

export interface DeferButtonConfig {
    tomorrow: ButtonConfig;
    minutes: ButtonConfig[];
    hours: ButtonConfig[];
}

export interface TimeButtonContext {
    futureTime: Date;
    now: Date;
    nextMorning: Date;
    index: number;
    processedButtons: (ButtonConfig | null)[];
}

export interface DeferEventDetail {
    rawTime: string | number;
}

export interface DeferPickerProps {
    task: Task;
    tasks: Task[];
    onDefer: (detail: DeferEventDetail) => void;
}

export interface DatePickerProps extends DeferPickerProps {
    tz: string;
}
