import type { DateTime } from "luxon";
import type { Task } from "./todoist";

export interface TaskActivity {
    date: DateTime;
    taskId: string;
    contextId: string;
    title: string;
    temporary: boolean | null;
}

export interface TodoistActivity {
    event_date: string;
    object_id: string;
    parent_project_id: string;
    extra_data: {
        content: string;
    };
}

export interface HistoryProps {
    entityId: string;
    content: string;
    activity:
        | TaskActivity[]
        | Promise<TaskActivity[] | undefined>
        | undefined
        | Record<string, { dots: { color: string }[]; tasks: Task[] }>;
    title?: string;
}

export interface DailyGoalTooltipProps {
    dailyGoal: number;
    sortedByTime: TaskActivity[];
    isLoading: boolean;
}
