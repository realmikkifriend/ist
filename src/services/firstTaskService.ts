import { get } from "svelte/store";
import { todoistData, firstDueTask, previousFirstDueTask } from "../stores/stores";
import { userSettings } from "../stores/interface";
import { todoistAccessToken } from "../stores/secret";
import { handleInitialChecks, enrichTask } from "./taskEnrichmentService";
import { success } from "../services/toastService";
import { updateDueTasks } from "../services/sidebarService";
import { shouldShowNewTaskToast } from "../utils/firstTaskUtils";
import type { Task, TodoistData } from "../types/todoist";
import type { UserSettings } from "../types/interface";

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

/**
 * Skip the current task and summon the next one.
 * @param {Task} task - The task to skip.
 * @returns {Promise<{task: Task | null, contextCleared: boolean}>} The next task and a flag indicating if the context was cleared.
 */
export const skipTask = async (
    task: Task,
): Promise<{ task: Task | null; contextCleared: boolean }> => {
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
        return summonTask(reverseTasks[nextIndex], true);
    }
    return clearSelectedTask();
};

/**
 * Update the first due task, loading comments and handling context changes.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @returns {Promise<{task: Task | null, contextCleared: boolean, showNewTaskToast: boolean}>} The new first due task, a flag indicating if the context was cleared, and a flag indicating if the new task toast should be shown.
 */
export const updateFirstDueTask = async (
    task: Task | null = null,
): Promise<{ task: Task | null; contextCleared: boolean; showNewTaskToast: boolean }> => {
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
            contextCleared: false,
            showNewTaskToast: initialCheckResult.showNewTaskToast ?? false,
        };
    }

    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const { tasks: dueTasks, contextCleared } = task
        ? { tasks: [task], contextCleared: false }
        : updateDueTasks($todoistData.dueTasks, selectedContextId);

    if (contextCleared) {
        success("No more tasks in context! Showing all due tasks...");
    }

    const { task: newTask, showNewTaskToast } = await processDueTaskUpdate(
        dueTasks,
        prevTask,
        selectedContextId,
        initialCheckResult.taskToSet,
    );

    debounceState.timeoutId = setTimeout(() => {
        debounceState.timeoutId = null;
    }, 2000);

    return { task: newTask, contextCleared, showNewTaskToast };
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

/**
 * Summon a task as the first due task.
 * @param {Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean }} task - The task to summon.
 * @param {boolean} enableSkip - Whether to enable skip. Defaults to false.
 * @returns {Promise<{task: Task | null, contextCleared: boolean}>} The summoned task and a flag indicating if the context was cleared.
 */
export async function summonTask(
    task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
    enableSkip: boolean = false,
): Promise<{ task: Task | null; contextCleared: boolean }> {
    if (!task.firstDue || enableSkip) {
        debounceState.clearDebounceTimeout();
        if (enableSkip) {
            task.skip = true;
        }
        const currentFirstDueSummoned = get(firstDueTask)?.summoned;

        task.summoned = currentFirstDueSummoned || window.location.hash;

        const result = await updateFirstDueTask(task);
        return { task: result.task, contextCleared: result.contextCleared };
    }
    return { task: get(firstDueTask), contextCleared: false };
}

/**
 * Handles the click event on the badge, updating navigation and state as needed.
 * @returns {Promise<{task: Task | null, contextCleared: boolean}>} The new first due task and a flag indicating if the context was cleared.
 */
export async function clearSelectedTask(): Promise<{ task: Task | null; contextCleared: boolean }> {
    const $firstDueTask = get(firstDueTask);
    const selectedContext = get(userSettings).selectedContext;

    if ($firstDueTask?.summoned) {
        window.location.hash = $firstDueTask.summoned as string;
    }

    if ($firstDueTask?.summoned || selectedContext) {
        debounceState.clearDebounceTimeout();
        if (selectedContext) {
            userSettings.update((settings: UserSettings) => ({
                ...settings,
                selectedContext: null,
            }));
            success("No more tasks in context! Showing all due tasks...");
        }
        const result = await updateFirstDueTask();
        return { task: result.task, contextCleared: result.contextCleared };
    }
    return { task: $firstDueTask, contextCleared: false };
}
