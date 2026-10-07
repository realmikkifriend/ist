import { get } from "svelte/store";
import { todoistData, previousDisplayTask } from "../stores/stores";
import { userSettings } from "../stores/interface";
import { todoistAccessToken } from "../stores/secret";
import { handleInitialChecks, enrichTask } from "./taskEnrichmentService";
import { doShowNewTaskToast, getTaskContextData } from "../utils/firstTaskUtils";
import type { Task, TodoistData, UpdateDisplayTaskResult } from "../types/todoist";

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
 * Update the first due task, loading comments and handling context changes.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @returns {Promise<{task: Task | null, showNewTaskToast: boolean}>} The new first due task and a flag indicating if the new task toast should be shown.
 */
export const updateDisplayTask = async (
    task: Task | null = null,
): Promise<UpdateDisplayTaskResult> => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousDisplayTask);

    const initialCheckResult = await handleInitialChecks(
        task,
        $todoistData,
        debounceState.timeoutId,
    );

    if (initialCheckResult.action === "exit" || initialCheckResult.action === "set_task_and_exit") {
        return {
            task: initialCheckResult.taskToSet ?? null,
            showNewTaskToast: initialCheckResult.showNewTaskToast ?? false,
            doClearContext: false,
            dueTasks: $todoistData.dueTasks,
        };
    }

    const { selectedContextId, filteredByContext, doClearContext, tasksToConsiderForNext } =
        getTaskContextData(task, $todoistData, get(userSettings));

    const { task: newTask, showNewTaskToast } = await processDueTaskUpdate(
        tasksToConsiderForNext,
        prevTask,
        doClearContext ? null : selectedContextId,
        initialCheckResult.taskToSet,
    );

    debounceState.timeoutId = setTimeout(() => {
        debounceState.timeoutId = null;
    }, 2000);

    return {
        task: newTask,
        showNewTaskToast,
        doClearContext: doClearContext,
        dueTasks: filteredByContext,
    };
};

/**
 * Processes the update for the first due task, including loading comments and handling toast notifications.
 * When the first-due task is unchanged since the previous display, the previous
 * task is reused as-is (same reference) so its cached comments, activity and
 * Dynalist widgets are not re-enriched or re-rendered.
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

    if (!preEnrichedTask && prevTask && prevTask.id === taskToProcess.id) {
        return { task: prevTask, showNewTaskToast: false };
    }

    const taskWithData = await enrichTask(taskToProcess, get(todoistAccessToken));

    const showNewTaskToast = doShowNewTaskToast(taskWithData, prevTask, selectedContextId);

    return { task: taskWithData, showNewTaskToast };
};
