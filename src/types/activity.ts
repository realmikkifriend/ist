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

export interface GetAllActivityDataParams {
    startDate: DateTime;
    endDate: DateTime;
    accumulatedData?: TaskActivity[];
    cursor?: string | null;
    task: Task | null;
}

export interface TodoistActivityResponse {
    next_cursor: string | null;
    results: TodoistActivity[];
}
