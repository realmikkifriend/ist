import type { Task, UpdateFirstDueTaskResult, TaskUpdates } from "./todoist";
import type { TaskActivity } from "./activity";

export type MethodsContext = {
    handleRefresh: () => Promise<void>;
    handleClearSelectedTask: () => Promise<void>;
    handleContextChange: (contextId: string | null) => void;
    updateDisplayedTask: () => Promise<void>;
    handleSkipTask: () => Promise<void>;
    summonTask: (
        task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
        enableSkip?: boolean,
    ) => Promise<UpdateFirstDueTaskResult>;
    clearPreviousFirstDueTask: () => void;
    updateTodoistDataResources: (taskUpdates?: TaskUpdates, deletedTaskIds?: string[]) => void;
    addTaskActivityEntry: (newActivityEntry: TaskActivity) => void;
};
