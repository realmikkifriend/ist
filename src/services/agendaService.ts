import { get } from "svelte/store";
import { firstDueTask, previousFirstDueTask } from "../stores/stores";
import { setFirstDueTask } from "../js/first";
import { DateTime } from "luxon";
import type { Task } from "../types/todoist";

/**
 * Mark tasks with firstDue and closeTiming properties.
 * @param {Task[]} tasks - The tasks to mark.
 * @returns {(Task & { firstDue?: boolean; closeTiming?: boolean })[]} Marked tasks.
 */
export function markTasks(tasks: Task[]): (Task & { firstDue?: boolean; closeTiming?: boolean })[] {
    const firstDueTaskID = get(firstDueTask)?.id || null;

    return tasks.map((currentTask, index) => {
        const markedTask: Task & { firstDue?: boolean; closeTiming?: boolean } = {
            ...currentTask,
            firstDue: firstDueTaskID === currentTask.id,
        };

        if (index > 0) {
            const previousTaskDue = tasks[index - 1].due?.date;
            const currentTaskDue = currentTask.due?.date;

            if (previousTaskDue && currentTaskDue) {
                const differenceInMinutes = DateTime.fromISO(currentTaskDue).diff(
                    DateTime.fromISO(previousTaskDue),
                    "minutes",
                ).minutes;

                markedTask.closeTiming = differenceInMinutes <= 10;
            } else {
                markedTask.closeTiming = false;
            }
        } else {
            markedTask.closeTiming = false;
        }
        return markedTask;
    });
}

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

        setFirstDueTask(task);
        previousFirstDueTask.set(get(firstDueTask) || null);
    }

    window.location.hash = "";
}

/**
 * Open the agenda drawer for a specific agenda type.
 * @param {string} agendaType - The agenda type to open.
 * @returns {void}
 */
export function openAgenda(agendaType: string = "today"): void {
    window.location.hash = agendaType;

    const drawerCheckbox = document.getElementById("my-drawer") as HTMLInputElement | null;
    if (drawerCheckbox) {
        drawerCheckbox.checked = false;
    }
}
