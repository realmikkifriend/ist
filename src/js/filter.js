import { DateTime } from "luxon";
import { getTaskTime } from "./time";

function createContextLookup(contexts) {
    return contexts.reduce((acc, context) => {
        acc[context.id] = context.child_order;
        return acc;
    }, {});
}

function processDueProperties(task, timeZone) {
    if (!task.due) {
        return false;
    }

    task.due.extractedTime = getTaskTime(task.due.string);
    task.due.all_day = task.due.date && !task.due.extractedTime ? 1 : 0;
    task.due.date_object = DateTime.fromISO(task.due.datetime || task.due.date, {
        zone: timeZone,
    }).toJSDate();
    return task.due.date_object < new Date();
}

function filterDueTasks(tasks, timeZone) {
    return tasks.filter((task) => processDueProperties(task, timeZone));
}

function compareTasks(a, b, contextLookup, timeZone) {
    const childOrderA = contextLookup[a.context_id] || 0;
    const childOrderB = contextLookup[b.context_id] || 0;
    if (childOrderA !== childOrderB) {
        return childOrderA - childOrderB;
    }

    if (b.priority !== a.priority) {
        return b.priority - a.priority;
    }

    const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone }).toJSDate();
    const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone }).toJSDate();
    return dateA - dateB;
}

export function filterAndSortDueTasks(tasks, contexts, timeZone) {
    const contextLookup = createContextLookup(contexts);
    const dueTasks = filterDueTasks(tasks, timeZone);

    dueTasks.sort((a, b) => compareTasks(a, b, contextLookup, timeZone));
    return dueTasks;
}
