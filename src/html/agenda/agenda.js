import { DateTime } from "luxon";

export const getTasksForDate = (date, todoistResources) => {
    const startOfDay = date.startOf("day");
    const endOfDay = date.plus({ days: 1 }).startOf("day");

    return todoistResources.items
        .filter((task) => {
            const taskDate = DateTime.fromISO(task.due.date);
            return (
                task.due &&
                taskDate.toMillis() >= startOfDay.toMillis() &&
                taskDate.toMillis() < endOfDay.toMillis()
            );
        })
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

export function markCloseTasks(tasks) {
    return tasks.map((currentTask, index) => {
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
    const taskDateTime = DateTime.fromISO(task.due.date);

    const timeDifference = previousTaskDue
        ? taskDateTime.diff(DateTime.fromISO(previousTaskDue.due.date), "minutes").minutes
        : taskDateTime.diff(taskDateTime.startOf("hour"), "minutes").minutes;

    return 1 * (timeDifference * 0.05);
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
