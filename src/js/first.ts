import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { success, newFirstTask } from "./toasts";
import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "./stores";
import { getTaskComments } from "./api";
import FirstDueTaskToast from "../html/FirstDueTaskToast.svelte";
import { summonTask } from "../html/agenda/agenda";
import { handleBadgeClick } from "../html/sidebar/sidebar";
import type { SvelteComponent } from "svelte";
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
 * Update the first due task, loading comments and handling context changes.
 * @returns {Promise<void>}
 */
export const updateFirstDueTask = async (): Promise<void> => {
    const $todoistData: TodoistData = get(todoistData);
    const prevTask: Task | null = get(previousFirstDueTask);

    if (!$todoistData?.dueTasks?.length && !prevTask?.summoned) {
        setFirstDueTask(null);
        return;
    }

    if (prevTask?.summoned) {
        return;
    }

    const selectedContextId: string | null = get(userSettings).selectedContext?.id ?? null;
    const dueTasks: Task[] = updateDueTasks($todoistData.dueTasks, selectedContextId);

    const newTask: Task = dueTasks[0];

    const comments = await getTaskComments(newTask.id);
    (newTask as Task & { comments: Comment[] }).comments = comments;

    if (
        prevTask &&
        newTask.id !== prevTask.id &&
        (!selectedContextId || prevTask.contextId === selectedContextId) &&
        window.location.hash !== "#today" &&
        window.location.hash !== "#tomorrow"
    ) {
        newFirstTask(FirstDueTaskToast as unknown as typeof SvelteComponent, () =>
            setFirstDueTask(newTask),
        );
    } else {
        toast.pop({ target: "wait" });
        setFirstDueTask(newTask);
    }
};
