import { get } from "svelte/store";
import { firstDueTask, previousFirstDueTask } from "../../stores/stores";
import { setFirstDueTask } from "../../js/first";
import { DateTime } from "luxon";
import type { Task, TodoistData } from "../../types/todoist";
import type { AgendaData } from "../../types/agenda";

/**
 * Get all tasks for a specific date.
 * @param {DateTime} date - The date to filter tasks for.
 * @param {TodoistData} todoistData - The Todoist data containing tasks.
 * @returns {Task[]} Array of tasks for the given date.
 */
export const getTasksForDate = (date: DateTime, todoistData: TodoistData): Task[] => {
    const startOfDay = date.startOf("day");
    const endOfDay = date.plus({ days: 1 }).startOf("day");

    return todoistData.tasks.filter((task: Task) => {
        if (!task.due) return false;
        const taskDate = DateTime.fromISO(task.due.date);
        return (
            task.due &&
            taskDate.toMillis() >= startOfDay.toMillis() &&
            taskDate.toMillis() < endOfDay.toMillis()
        );
    });
};

/**
 * Sort agenda tasks by due date and priority, and group by time presence.
 * @param {Task[]} tasks - The tasks to sort.
 * @returns {AgendaData} Sorted and grouped tasks.
 */
export const sortAgendaTasks = (tasks: Task[]): AgendaData => {
    return tasks
        .sort((a, b) => {
            const timeA = DateTime.fromISO(a.due?.date ?? "").toMillis();
            const timeB = DateTime.fromISO(b.due?.date ?? "").toMillis();
            if (timeA === timeB) {
                return (b.priority || 0) - (a.priority || 0);
            }
            return timeA - timeB;
        })
        .reduce<AgendaData>(
            (acc, task) => {
                if (task.due?.date && task.due.date.includes("T")) {
                    acc.tasks.push(task);
                } else {
                    acc.tasksWithNoTime.push(task);
                }
                return acc;
            },
            { tasksWithNoTime: [], tasks: [], todayTasks: [], tasksForDate: [] },
        );
};

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

const getPositionForFirstTask = (taskDateTime: DateTime): number => {
    const minutes = taskDateTime.minute;
    return (minutes > 45 ? 46 : minutes) * 0.1;
};

const getPositionForSubsequentTask = (taskDateTime: DateTime, previousTaskDue: Task): number => {
    const timeDifference = taskDateTime.diff(
        DateTime.fromISO(previousTaskDue.due!.date),
        "minutes",
    ).minutes;

    if (taskDateTime.minute > 45 && timeDifference < 20) {
        return 0;
    }

    return Math.pow(timeDifference + 1, 2) * 0.0009;
};

/**
 * Calculate the position of a task in the agenda.
 * @param {Task & { closeTiming?: boolean }} task - The current task.
 * @param {Task | undefined} previousTaskDue - The previous task, if any.
 * @returns {number} The calculated position.
 */
export const calculateTaskPosition = (
    task: Task & { closeTiming?: boolean },
    previousTaskDue?: Task,
): number => {
    if (task.closeTiming) {
        return 0;
    }

    const taskDateTime = DateTime.fromISO(task.due?.date ?? "");

    if (!previousTaskDue) {
        return getPositionForFirstTask(taskDateTime);
    }

    return getPositionForSubsequentTask(taskDateTime, previousTaskDue);
};

/**
 * Calculate the style class for a task in the agenda.
 * @param {number} index - The index of the task to be styled.
 * @param {(Task & { closeTiming?: boolean })[]} tasks - The list of tasks.
 * @returns {string} The style class.
 */
export const calculateTaskStyle = (
    index: number,
    tasks: (Task & { closeTiming?: boolean })[],
): string => {
    const count = tasks
        .slice(0, index + 1)
        .reverse()
        .reduce((acc, task) => (task.closeTiming ? acc + 1 : acc), 0);

    const isIndented = count % 2 !== 0;

    const marginClass = isIndented ? "ml-[40%]" : "ml-0";
    const zIndexClass = isIndented ? "z-30" : "z-10";

    return `${marginClass} ${zIndexClass}`;
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
