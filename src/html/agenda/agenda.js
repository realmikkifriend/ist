import { DateTime } from "luxon";
import { get } from "svelte/store";
import { toast } from "@zerodevx/svelte-toast";
import { firstDueTask, previousFirstDueTask } from "../../js/stores";
import { setFirstDueTask } from "../../js/first";

export const getTasksForDate = (date, todoistData) => {
    const startOfDay = date.startOf("day");
    const endOfDay = date.plus({ days: 1 }).startOf("day");

    return todoistData.tasks.filter((task) => {
        const taskDate = DateTime.fromISO(task.due.date);
        return (
            task.due &&
            taskDate.toMillis() >= startOfDay.toMillis() &&
            taskDate.toMillis() < endOfDay.toMillis()
        );
    });
};

export const sortAgendaTasks = (tasks) => {
    return tasks
        .sort((a, b) => {
            const timeA = DateTime.fromISO(a.due.date).toMillis();
            const timeB = DateTime.fromISO(b.due.date).toMillis();
            if (timeA === timeB) {
                return (b.priority || 0) - (a.priority || 0);
            }
            return timeA - timeB;
        })
        .reduce(
            (acc, task) => {
                if (task.due.date.includes("T")) {
                    acc.tasks.push(task);
                } else {
                    acc.tasksWithNoTime.push(task);
                }
                return acc;
            },
            { tasksWithNoTime: [], tasks: [] },
        );
};

export function markTasks(tasks) {
    const firstDueTaskID = get(firstDueTask)?.id || null;

    return tasks.map((currentTask, index) => {
        currentTask.firstDue = firstDueTaskID === currentTask.id;

        if (index > 0) {
            const previousTaskDue = tasks[index - 1].due.date;
            const currentTaskDue = currentTask.due.date;

            const differenceInMinutes = DateTime.fromISO(currentTaskDue).diff(
                DateTime.fromISO(previousTaskDue),
                "minutes",
            ).minutes;

            if (differenceInMinutes <= 10) {
                return { ...currentTask, closeTiming: true };
            }
        }
        return { ...currentTask, closeTiming: false };
    });
}

export const calculateTaskPosition = (task, previousTaskDue) => {
    if (task.closeTiming) {
        return 0;
    } else {
        const taskDateTime = DateTime.fromISO(task.due.date);

        const timeDifference = previousTaskDue
            ? taskDateTime.diff(DateTime.fromISO(previousTaskDue.due.date), "minutes").minutes
            : taskDateTime.diff(taskDateTime.startOf("hour"), "minutes").minutes;

        if (!previousTaskDue) {
            return (taskDateTime.minute > 45 ? 46 : timeDifference) * 0.1;
        } else if (taskDateTime.minute > 45 && timeDifference < 20) {
            return 0;
        } else {
            return Math.pow(timeDifference + 1, 2) * 0.0009;
        }
    }
};

export const calculateTaskStyle = (index, tasks) => {
    let count = 0;
    let currentIndex = index;

    while (currentIndex >= 0 && tasks[currentIndex].closeTiming) {
        count++;
        currentIndex--;
    }

    const isIndented = count % 2 !== 0;

    const marginClass = isIndented ? "ml-[40%]" : "ml-0";
    const zIndexClass = isIndented ? "z-30" : "z-10";

    return `${marginClass} ${zIndexClass}`;
};

export function summonTask(task, enableSkip = false) {
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

export function openAgenda(agendaType = "today") {
    toast.pop({ target: "wait" });
    window.location.hash = agendaType;

    const drawerCheckbox = document.getElementById("my-drawer");
    if (drawerCheckbox) {
        drawerCheckbox.checked = false;
    }
}
