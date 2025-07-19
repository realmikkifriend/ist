import { DateTime } from "luxon";
import { getTaskTime } from "./time";

export function getDueTasks(data) {
    const { tasks, contexts, user } = data;
    const timeZone = user?.tz_info?.name || "local";

    return filterAndSortTasks(tasks, contexts, { timeZone });
}

export function filterAndSortTasks(tasks, contexts, options = {}) {
    const { timeZone, reverse = false } = options;
    const contextLookup = createContextLookup(contexts);

    const filteredTasks = timeZone ? filterDueTasks(tasks, timeZone) : tasks;

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        return compareTasks(a, b, contextLookup, timeZone, reverse);
    });
    return sortedTasks;
}

function createContextLookup(contexts) {
    return contexts.reduce((acc, context) => {
        acc[context.id] = context.childOrder;
        return acc;
    }, {});
}

function filterDueTasks(tasks, timeZone) {
    return tasks.filter((task) => processDueProperties(task, timeZone));
}

function processDueProperties(task, timeZone) {
    if (!task.due) {
        return false;
    }

    task.due.extractedTime = getTaskTime(task.due.string);
    task.due.allDay = task.due.date && !task.due.extractedTime ? 1 : 0;
    task.due.dateObject = DateTime.fromISO(task.due.datetime || task.due.date, {
        zone: timeZone,
    }).toJSDate();
    return task.due.dateObject < new Date();
}

function compareTasks(a, b, contextLookup, timeZone, reverse = false) {
    const [first, second] = reverse ? [a, b] : [b, a];

    if (first.priority !== second.priority) {
        return first.priority - second.priority;
    }

    const orderA = contextLookup[a.contextId] || 0;
    const orderB = contextLookup[b.contextId] || 0;
    if (orderA !== orderB) {
        return reverse ? orderB - orderA : orderA - orderB;
    }

    if (!timeZone) return 0;

    const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone }).toJSDate();
    const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone }).toJSDate();
    return dateA - dateB;
}
