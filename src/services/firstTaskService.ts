import { get } from "svelte/store";
import { success, newFirstTask } from "../services/toastService";
import {
    todoistAccessToken,
    todoistData,
    userSettings,
    firstDueTask,
    previousFirstDueTask,
} from "../stores/stores";
import { getTaskComments } from "../utils/apiUtils";
import type { Task, Comment, TodoistData } from "../types/todoist";
import type { UserSettings } from "../types/interface";
import { filterTasksByContext, shouldShowNewTaskToast } from "../utils/firstTaskUtils";

const debounceState: { timeoutId: ReturnType<typeof setTimeout> | null } = { timeoutId: null };

/**
 * Sets the firstDueTask and previousFirstDueTask stores.
 * @param {Task | null} task - The task to set in the stores.
 * @returns {void}
 */
const setDueTaskStores = (task: Task | null | Promise<Task>): void => {
    if (task instanceof Promise) {
        void task.then((resolvedTask) => {
            firstDueTask.set(resolvedTask);
            previousFirstDueTask.set(resolvedTask);
        });
    } else {
        firstDueTask.set(task);
        previousFirstDueTask.set(task);
    }
};

/**
 * Get the name of the current context, either from user settings or from the first due task's context.
 * @returns - The context name, or an empty string if not found.
 */
export function getContextName(): string {
    const $userSettings = get(userSettings);
    const $todoistData = get(todoistData);
    const $firstDueTask = get(firstDueTask);

    if ($userSettings?.selectedContext?.name) {
        return $userSettings.selectedContext.name;
    }
    if ($todoistData?.contexts) {
        const context = $todoistData.contexts.find((c) => c.id === $firstDueTask?.contextId);
        if (context && typeof context.name === "string") return context.name;
    }
    return "";
}

/**
 * Skip the current task and summon the next one.
 * @param {Task} task - The task to skip.
 * @returns {void}
 */
export const skipTask = (task: Task): void => {
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
        summonTask(reverseTasks[nextIndex], true);
    } else {
        clearSelectedTask();
    }
};

/**
 * Loads comments for a given task and attaches them.
 * @param {Task} task - The task to load comments for.
 * @returns The task with a promise for the comments.
 */
const loadCommentsForTask = (task: Task): Task => {
    const commentsPromise = getTaskComments(get(todoistAccessToken), task.id);
    (task as Task & { comments: Promise<Comment[]> }).comments = commentsPromise;
    return task;
};

/**
 * Update the first due task, loading comments and handling context changes.
 * @param {Task | null} task - Optional task to set as the first due task.
 */
export const updateFirstDueTask = (task: Task | null = null): void => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousFirstDueTask);

    if (handleInitialChecks(task, $todoistData, prevTask)) {
        return;
    }

    if (debounceState.timeoutId) {
        return;
    }

    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const dueTasks: Task[] = updateDueTasks($todoistData.dueTasks, selectedContextId);

    void processDueTaskUpdate(dueTasks, prevTask, selectedContextId);

    debounceState.timeoutId = setTimeout(() => {
        debounceState.timeoutId = null;
    }, 2000);
};

/**
 * Handles initial checks and early exits for updateFirstDueTask.
 * @param {Task | null} task - Optional task to set as the first due task.
 * @param {TodoistData} $todoistData - The current Todoist data.
 * @param {Task | null} prevTask - The previously set first due task.
 * @returns {Promise<boolean>} True if the function should exit early, false otherwise.
 */
const handleInitialChecks = (
    task: Task | null,
    $todoistData: TodoistData,
    prevTask: Task | null,
): boolean => {
    if (task) {
        const taskWithComments = loadCommentsForTask(task);
        setDueTaskStores(taskWithComments);
        return true;
    }

    if (prevTask?.summoned && !task) {
        return true;
    }

    if (!$todoistData?.dueTasks?.length) {
        setDueTaskStores(null);
        return true;
    }
    return false;
};

/**
 * Update due tasks based on the selected context ID.
 * @param {Task[]} dueTasks - The list of due tasks.
 * @param {string | null} contextId - The selected context ID from settings.
 * @returns {Task[]} The updated list of due tasks.
 */
const updateDueTasks = (dueTasks: Task[], contextId: string | null): Task[] => {
    if (contextId) {
        const filteredDueTasks = filterTasksByContext(dueTasks, contextId);
        if (!filteredDueTasks.length) {
            userSettings.update((settings: UserSettings) => ({
                ...settings,
                selectedContext: null,
            }));
            success("No more tasks in context! Showing all due tasks...");
            return dueTasks;
        }
        return filteredDueTasks;
    }
    return dueTasks;
};

/**
 * Processes the update for the first due task, including loading comments and handling toast notifications.
 * @param {Task[]} dueTasks - The list of due tasks.
 * @param {Task | null} prevTask - The previously set first due task.
 * @param {string | null} selectedContextId - The ID of the currently selected context.
 */
const processDueTaskUpdate = (
    dueTasks: Task[],
    prevTask: Task | null,
    selectedContextId: string | null,
): void => {
    if (!dueTasks.length) {
        return;
    }
    const newTaskWithComments = loadCommentsForTask(dueTasks[0]);

    if (shouldShowNewTaskToast(newTaskWithComments, prevTask, selectedContextId)) {
        newFirstTask(() => setDueTaskStores(newTaskWithComments));
    } else {
        setDueTaskStores(newTaskWithComments);
    }
};

/**
 * Summon a task as the first due task.
 * @param {Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean }} task - The task to summon.
 * @param {boolean} enableSkip - Whether to enable skip. Defaults to false.
 * @returns {void}
 */
export function summonTask(
    task: Task & { firstDue?: boolean; skip?: boolean; summoned?: string | boolean },
    enableSkip: boolean = false,
): void {
    if (!task.firstDue || enableSkip) {
        if (enableSkip) {
            task.skip = true;
        }
        const currentFirstDueSummoned = get(firstDueTask)?.summoned;

        task.summoned = currentFirstDueSummoned || window.location.hash;

        void (() => {
            updateFirstDueTask(task);
            window.location.hash = "";
        })();
    } else {
        window.location.hash = "";
    }
}

/**
 * Handles the click event on the badge, updating navigation and state as needed.
 * @returns {void}
 */
export function clearSelectedTask(): void {
    const $firstDueTask = get(firstDueTask);
    const selectedContext = get(userSettings).selectedContext;

    if ($firstDueTask?.summoned) {
        window.location.hash = $firstDueTask.summoned as string;

        firstDueTask.set(null);

        void updateFirstDueTask();
    } else if (selectedContext) {
        clearSelectedContext();
    }
}

/**
 * Clears the selected context and previous first due task.
 * @returns {void}
 */
function clearSelectedContext(): void {
    previousFirstDueTask.set(null);
    userSettings.update((settings) => ({ ...settings, selectedContext: null }));
}
