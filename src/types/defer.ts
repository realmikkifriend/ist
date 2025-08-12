import type { Priority, Task } from "./todoist";
import type { DateTime } from "luxon";

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

export interface CalendarContext {
    monthYear: string;
    now: DateTime;
    soonTasks: Task[];
    tz: string;
    contextId: string;
}

export interface TimeButtonContext {
    futureTime: Date;
    now: Date;
    nextMorning: Date;
    index: number;
    processedButtons: (TimeButtonConfig | null)[];
}

export interface DeferEventDetail {
    rawTime: string | number;
}

export interface DatePickerProps {
    taskToDefer: Task;
    tz: string;
    tasks: Task[];
    onDefer: (detail: DeferEventDetail) => void;
}

export interface CalendarDayProps {
    day: DateTime;
    dots: { color: string }[];
    tooltip?: Task[] | undefined;
    disable?: "past" | "future" | null;
}

export interface TimePickerProps {
    task: Task;
    tasks: Task[];
    onDefer: (detail: DeferEventDetail) => void;
}
