import type { DateTime } from "luxon";
import type { Task } from "./todoist";
import type { TaskActivity } from "./activity";

export type DateInfo = Record<string, { dots: { color: string }[]; tasks: Task[] }>;

export interface CalendarContext {
    monthYear: string;
    now: DateTime;
    soonTasks: Task[];
    tz: string;
    contextId: string;
}

export interface CalendarDayProps {
    day: DateTime;
    dots: { color: string }[];
    tooltip?: Task[] | undefined;
    disable?: "past" | "future" | null;
}

export interface CalendarHeaderProps {
    disable?: "past" | "future" | null;
    displayDate: DateTime;
    onchangeMonth: (date: DateTime) => void;
}

export interface HistoryProps {
    entityId: string;
    content: string;
    activity: TaskActivity[] | DateInfo | Promise<TaskActivity[] | DateInfo> | undefined;
    title?: string;
}
