import type { Task, UpdateFirstDueTaskResult, TaskUpdates } from "./todoist";
import type { TaskActivity } from "./activity";

export interface AppStateMutatorsContext {
    changeSelectedContext: (context: { id: string; name: string } | null) => void;
    setTask: (task: Task | null) => void;
    clearPreviousFirstDueTask: () => void;
    updateTodoistDataResources: (taskUpdates?: TaskUpdates, deletedTaskIds?: string[]) => void;
    handleDataUpdates: (
        updatedTodoistData: UpdateFirstDueTaskResult["updatedTodoistData"],
        doClearContext: boolean,
    ) => void;
    addTaskActivityEntry: (newActivityEntry: TaskActivity) => void;
    handleTaskDisplay: (task: Task | null, showNewTaskToast: boolean) => void;
}

export interface HandlerMethodsContext {
    handleRefresh: () => Promise<void>;
    handleClearSelectedTask: () => Promise<void>;
    handleContextChange: (contextId: string | null) => void;
    updateDisplayedTask: () => Promise<void>;
    handleSkipTask: () => void;
    summonTask: (
        task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
        enableSkip?: boolean,
    ) => Promise<UpdateFirstDueTaskResult>;
}
