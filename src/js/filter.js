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

    let filteredTasks = tasks;
    if (timeZone) {
        filteredTasks = filterDueTasks(filteredTasks, timeZone);
    }

    filteredTasks.sort((a, b) => {
        const result = compareTasks(a, b, contextLookup, timeZone);
        return reverse ? -result : result;
    });
    return filteredTasks;
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

function compareTasks(a, b, contextLookup, timeZone) {
    const childOrderA = contextLookup[a.contextId] || 0;
    const childOrderB = contextLookup[b.contextId] || 0;
    if (childOrderA !== childOrderB) {
        return childOrderA - childOrderB;
    }

    if (b.priority !== a.priority) {
        return b.priority - a.priority;
    }

    if (!timeZone) {
        return 0;
    }

    const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone }).toJSDate();
    const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone }).toJSDate();
    return dateA - dateB;
}
