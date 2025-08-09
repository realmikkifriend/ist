import type { DateTime } from "luxon";
import type { Task } from "../types/todoist";

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

export interface DailyGoalTooltipProps {
    dailyGoal: number;
    sortedByTime: TaskActivity[];
    isLoading: boolean;
}

export type GetAllActivityDataParams = {
    timeframe: DateTime[];
    accumulatedData?: TaskActivity[];
    cursor?: string | null;
    task: Task | null;
    emptyResponsesCount?: number;
};

export type ProcessActivityAccumulationParams = {
    processedActivityData: TaskActivity[];
    accumulatedData: TaskActivity[];
    startDate: DateTime;
    endDate: DateTime;
    emptyResponsesCount: number;
};

export type ProcessActivityAccumulationResult = {
    currentAccumulatedData: TaskActivity[];
    updatedEmptyResponsesCount: number;
    done: boolean;
};
