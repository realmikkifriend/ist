import type { Task, UpdateDisplayTaskResult, TaskUpdates } from "./todoist";
import type { TaskActivity } from "./activity";

export interface AppStateMutatorsContext {
    changeSelectedContext: (context: { id: string; name: string } | null) => void;
    setTask: (task: Task | null) => void;
    clearPreviousDisplayTask: () => void;
    updateTodoistDataResources: (taskUpdates?: TaskUpdates, deletedTaskIds?: string[]) => void;
    handleDataUpdates: (
        updatedTodoistData: UpdateDisplayTaskResult["updatedTodoistData"],
        doClearContext: boolean,
    ) => void;
    addTaskActivityEntry: (newActivityEntry: TaskActivity) => void;
    handleTaskDisplay: (task: Task | null, showNewTaskToast: boolean) => void;
}

export interface HandlerMethodsContext {
    handleRefresh: () => Promise<void>;
    handleContextChange: (contextId: string | null) => void;
    updateDisplayedTask: () => Promise<void>;
    handleSkipTask: () => void;
    summonTask: (
        task: Task & { displayed?: boolean; skip?: boolean; summoned?: string | boolean },
        enableSkip?: boolean,
    ) => Promise<UpdateDisplayTaskResult>;
}
