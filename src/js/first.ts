import { get } from "svelte/store";
import { success, newFirstTask } from "../services/toastService";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../stores/stores";
import { getTaskComments } from "./api";
import { summonTask } from "../html/agenda/agenda";
import { handleBadgeClick } from "../services/sidebarService";
import type { Task, Comment, TodoistData } from "../../types/todoist";
import type { UserSettings } from "../../types/interface";

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
 * Set the first due task in the store.
 * @param {Task | null} task - The task to set as the first due task.
 * @returns {void}
 */
export const setFirstDueTask = (task: Task | null): void => {
    firstDueTask.set(task);
    previousFirstDueTask.set(task);
};

/**
 * Filter task list by context.
 * @param {Task[]} tasks - The list of tasks to filter.
 * @param {string} contextId - The context ID to filter by.
 * @returns {Task[]} The filtered list of tasks.
 */
const filterTasksByContext = (tasks: Task[], contextId: string): Task[] =>
    tasks.filter((task) => task.contextId === contextId);

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
        handleBadgeClick();
    }
};

/**
 * Determines whether to show a toast notification for a new task.
 * @param {Task} newTask - The new first-due task.
 * @param {Task | null} prevTask - The previous task.
 * @param {string | null} selectedContextId - The currently selected context ID.
 * @returns True if a toast should be shown, false otherwise.
 */
const shouldShowNewTaskToast = (
    newTask: Task,
    prevTask: Task | null,
    selectedContextId: string | null,
): boolean => {
    return (
        prevTask !== null &&
        newTask.id !== prevTask.id &&
        (!selectedContextId || prevTask.contextId === selectedContextId) &&
        window.location.hash !== "#today" &&
        window.location.hash !== "#tomorrow"
    );
};

/**
 * Loads comments for a given task and attaches them.
 * @param {Task} task - The task to load comments for.
 * @returns The task with comments.
 */
const loadCommentsForTask = async (task: Task): Promise<Task> => {
    const comments = await getTaskComments(task.id);
    (task as Task & { comments: Comment[] }).comments = comments;
    return task;
};

/**
 * Update the first due task, loading comments and handling context changes.
 * @returns {Promise<void>}
 */
export const updateFirstDueTask = async (): Promise<void> => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousFirstDueTask);

    if (prevTask?.summoned) {
        return;
    }

    if (!$todoistData?.dueTasks?.length) {
        setFirstDueTask(null);
        return;
    }

    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const dueTasks: Task[] = updateDueTasks($todoistData.dueTasks, selectedContextId);

    const newTaskWithComments = await loadCommentsForTask(dueTasks[0]);

    if (shouldShowNewTaskToast(newTaskWithComments, prevTask, selectedContextId)) {
        newFirstTask(() => setFirstDueTask(newTaskWithComments));
    } else {
        setFirstDueTask(newTaskWithComments);
    }
};
