import type { Task } from "./todoist";

export type QuarterHourPosition = 0.25 | 0.5 | 0.75;

export type GradientType = "blue" | "green" | "darkGreen" | "orange" | "red";

export interface SortedAgendaTasks {
    tasksWithNoTime: Task[];
    tasks: Task[];
}
