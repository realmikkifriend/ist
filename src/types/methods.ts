import type { Task, UpdateFirstDueTaskResult } from "./todoist";

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
};
