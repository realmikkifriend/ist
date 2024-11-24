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
