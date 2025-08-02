import type { Task } from "./todoist";

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
