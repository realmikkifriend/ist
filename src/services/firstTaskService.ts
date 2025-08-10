import { get } from "svelte/store";
import { todoistData, firstDueTask, previousFirstDueTask } from "../stores/stores";
import { userSettings } from "../stores/interface";
import { todoistAccessToken } from "../stores/secret";
import { handleInitialChecks, loadActivityForTask } from "./taskEnrichmentService";
import { newFirstTask } from "../services/toastService";
import { clearSelectedContext, updateDueTasks } from "../services/sidebarService";
import { shouldShowNewTaskToast, loadCommentsForTask } from "../utils/firstTaskUtils";
import type { Task, TodoistData } from "../types/todoist";

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
 * Sets the firstDueTask and previousFirstDueTask stores.
 * @param {Task | null} task - The task to set in the stores.
 * @returns {void}
 */
const setDueTaskStores = (task: Task | null | Promise<Task>): void => {
    const setTask = (t: Task | null) => {
        firstDueTask.set(t);
        previousFirstDueTask.set(t);
    };

    if (task instanceof Promise) {
        void task.then(setTask);
    } else {
        setTask(task);
    }
};

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
 * Update the first due task, loading comments and handling context changes.
 * @param {Task | null} task - Optional task to set as the first due task.
 */
export const updateFirstDueTask = (task: Task | null = null): void => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousFirstDueTask);

    const initialCheckResult = handleInitialChecks(task, $todoistData, prevTask);

    if (initialCheckResult.action === "exit") {
        return;
    }

    if (
        initialCheckResult.action === "set_task_and_exit" ||
        initialCheckResult.action === "set_task_and_continue"
    ) {
        setDueTaskStores(initialCheckResult.taskToSet!);
        if (initialCheckResult.action === "set_task_and_exit") {
            return;
        }
    }

    if (debounceState.timeoutId) {
        return;
    }

    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const dueTasks: Task[] = task
        ? [task]
        : updateDueTasks($todoistData.dueTasks, selectedContextId);

    void processDueTaskUpdate(dueTasks, prevTask, selectedContextId);

    debounceState.timeoutId = setTimeout(() => {
        debounceState.timeoutId = null;
    }, 2000);
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
    const taskWithData = loadActivityForTask(
        loadCommentsForTask(dueTasks[0], get(todoistAccessToken)),
    );

    if (shouldShowNewTaskToast(taskWithData, prevTask, selectedContextId)) {
        newFirstTask(() => setDueTaskStores(taskWithData));
    } else {
        setDueTaskStores(taskWithData);
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
        debounceState.clearDebounceTimeout();
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
    }

    if ($firstDueTask?.summoned || selectedContext) {
        firstDueTask.set(null);
        previousFirstDueTask.set(null);
        debounceState.clearDebounceTimeout();
        if (selectedContext) {
            clearSelectedContext();
        }
        void updateFirstDueTask();
    }
}
