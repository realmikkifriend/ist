import { get } from "svelte/store";
import { todoistData, previousFirstDueTask } from "../stores/stores";
import { userSettings } from "../stores/interface";
import { todoistAccessToken } from "../stores/secret";
import { handleInitialChecks, enrichTask } from "./taskEnrichmentService";
import { shouldShowNewTaskToast } from "../utils/firstTaskUtils";
import type { Task, TodoistData, UpdateFirstDueTaskResult } from "../types/todoist";

const debounceState: {
    timeoutId: ReturnType<typeof setTimeout> | null;
    clearDebounceTimeout: () => void;
} = {
    timeoutId: null,
    clearDebounceTimeout: (): void => {
        if (debounceState.timeoutId) {
            clearTimeout(debounceState.timeoutId);
            debounceState.timeoutId = null;
        }
    },
};

export { debounceState };

/**
 * Skip the current task and summon the next one.
 * @param {Task} task - The task to skip.
 * @returns {Promise<{task: Task | null, showNewTaskToast: boolean, contextCleared: boolean}>} The next task and related flags.
 */
export const skipTask = (task: Task): Promise<UpdateFirstDueTaskResult> => {
    const $todoistData: TodoistData = get(todoistData);
    const reverseTasksObj = $todoistData.reverseTasks as unknown as {
        today: Task[];
        tomorrow: Task[];
    };
    const reverseTasks =
        task.summoned === "#today" ? reverseTasksObj.today : reverseTasksObj.tomorrow;
    const currentIndex = reverseTasks.findIndex((t) => t.id === task.id);
    const nextIndex = currentIndex + 1;
    if (nextIndex < reverseTasks.length) {
        return Promise.resolve({
            task: reverseTasks[nextIndex],
            showNewTaskToast: false,
            contextCleared: false,
            dueTasks: get(todoistData).dueTasks,
        });
    }
    return Promise.resolve({
        task: null,
        showNewTaskToast: false,
        contextCleared: false,
        dueTasks: get(todoistData).dueTasks,
    });
};

/**
 * Update the first due task, loading comments and handling context changes.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @returns {Promise<{task: Task | null, showNewTaskToast: boolean}>} The new first due task and a flag indicating if the new task toast should be shown.
 */
export const updateFirstDueTask = async (
    task: Task | null = null,
): Promise<UpdateFirstDueTaskResult> => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousFirstDueTask);

    const initialCheckResult = await handleInitialChecks(
        task,
        $todoistData,
        debounceState.timeoutId,
    );

    if (initialCheckResult.action === "exit") {
        return {
            task: initialCheckResult.taskToSet ?? null,
            showNewTaskToast: initialCheckResult.showNewTaskToast ?? false,
            contextCleared: false,
            dueTasks: $todoistData.dueTasks,
        };
    }

    const { selectedContextId, filteredByContext, contextWasCleared, tasksToConsiderForNext } =
        getTaskContextData(task, $todoistData);

    const { task: newTask, showNewTaskToast } = await processDueTaskUpdate(
        tasksToConsiderForNext,
        prevTask,
        contextWasCleared ? null : selectedContextId,
        initialCheckResult.taskToSet,
    );

    debounceState.timeoutId = setTimeout(() => {
        debounceState.timeoutId = null;
    }, 2000);

    return {
        task: newTask,
        showNewTaskToast,
        contextCleared: contextWasCleared,
        dueTasks: filteredByContext,
    };
};

/**
 * Helper function to get task context data.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @param {TodoistData} todoistData - The current Todoist data.
 * @returns {{selectedContextId: string | null, filteredByContext: Task[], contextWasCleared: boolean, tasksToConsiderForNext: Task[]}} Tasks processed by context.
 */
const getTaskContextData = (task: Task | null, todoistData: TodoistData) => {
    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const currentDueTasks = todoistData.dueTasks;

    const filteredByContext = selectedContextId
        ? currentDueTasks.filter((t) => t.contextId === selectedContextId)
        : currentDueTasks;

    const contextWasCleared = Boolean(selectedContextId && filteredByContext.length === 0);

    const tasksToConsiderForNext =
        contextWasCleared && currentDueTasks.length > 0
            ? currentDueTasks
            : task
              ? [task]
              : filteredByContext;

    return { selectedContextId, filteredByContext, contextWasCleared, tasksToConsiderForNext };
};

/**
 * Processes the update for the first due task, including loading comments and handling toast notifications.
 * @param {Task[]} dueTasks - The list of due tasks.
 * @param {Task | null} prevTask - The previously set first due task.
 * @param {string | null} selectedContextId - The ID of the currently selected context.
 * @param {Task | null} preEnrichedTask - An optional task that has already been enriched.
 * @returns {Promise<{task: Task | null, showNewTaskToast: boolean}>} The processed task and a flag indicating if the new task toast should be shown.
 */
const processDueTaskUpdate = async (
    dueTasks: Task[],
    prevTask: Task | null,
    selectedContextId: string | null,
    preEnrichedTask: Task | null = null,
): Promise<{ task: Task | null; showNewTaskToast: boolean }> => {
    if (!dueTasks.length) {
        return { task: null, showNewTaskToast: false };
    }

    const taskToProcess = preEnrichedTask || dueTasks[0];
    const taskWithData = await enrichTask(taskToProcess, get(todoistAccessToken));

    const showNewTaskToast = shouldShowNewTaskToast(taskWithData, prevTask, selectedContextId);

    return { task: taskWithData, showNewTaskToast };
};
