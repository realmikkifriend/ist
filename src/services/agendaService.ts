import { get } from "svelte/store";
import { firstDueTask } from "../stores/stores";
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
