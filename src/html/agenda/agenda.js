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

export const calculateTaskPosition = (task, previousTaskDue) => {
    const taskDateTime = DateTime.fromISO(task.due.date);
    let position = Math.round((taskDateTime.minute / 60) * 90);
    if (previousTaskDue) {
        const timeDifference = taskDateTime.diff(
            DateTime.fromISO(previousTaskDue),
            "minutes",
        ).minutes;
        if (timeDifference <= 8) position += 15 - timeDifference;
    }
    return position;
};

const isTaskIndented = (currentTaskDue, previousTaskDue, isPreviousIndented) => {
    if (!previousTaskDue) return false;
    return (
        DateTime.fromISO(currentTaskDue).diff(DateTime.fromISO(previousTaskDue), "minutes")
            .minutes <= 10 && !isPreviousIndented
    );
};

export const calculateTaskStyle = (task, index, tasks) => {
    const isIndented = isTaskIndented(
        task.due.date,
        tasks[index - 1]?.due.date,
        index > 0
            ? isTaskIndented(tasks[index - 1]?.due.date, tasks[index - 2]?.due.date, false)
            : false,
    );
    return {
        marginLeft: isIndented ? "50%" : "0",
        zIndex: isIndented ? "30" : "10",
    };
};
