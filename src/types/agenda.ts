import type { DateTime } from "luxon";
import type { Task, ColorName } from "./todoist";

export type QuarterHourPosition = 0.25 | 0.5 | 0.75;

export type GradientType = "blue" | "green" | "darkGreen" | "orange" | "red";

export interface AgendaData {
    tasks: Task[];
    tasksWithNoTime: Task[];
    todayTasks: Task[];
    tasksForDate: Task[];
}

export interface DisplayData {
    title: string;
    headerGradientColor: string;
}

export interface AgendaHeaderProps {
    agendaData: AgendaData;
    displayData: DisplayData;
}

export interface AgendaHourProps {
    tasks: Task[];
    hour: number;
    title: string;
    now: DateTime;
}

export interface AgendaTaskProps {
    task: Task;
    color: ColorName;
}
