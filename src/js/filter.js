import { DateTime } from "luxon";
export function filterAndSortDueTasks(tasks, contexts, timeZone) {
    const contextLookup = contexts.reduce((acc, context) => {
        acc[context.id] = context.child_order;
        return acc;
    }, {});

    let dueTasks = tasks.filter((task) => {
        if (!task.due) {
            return false;
        }
        task.due.all_day = task.due.datetime ? 0 : 1;
        task.due.date_object = DateTime.fromISO(task.due.datetime || task.due.date, {
            zone: timeZone,
        }).toJSDate();
        return task.due.date_object < new Date();
    });

    dueTasks.sort((a, b) => {
        // sort by order of contexts
        const childOrderA = contextLookup[a.context_id] || 0;
        const childOrderB = contextLookup[b.context_id] || 0;
        if (childOrderA !== childOrderB) {
            return childOrderA - childOrderB;
        }

        // sort by priority
        if (b.priority !== a.priority) {
            return b.priority - a.priority;
        }

        // sort by due date
        const dateA = DateTime.fromISO(a.due.datetime || a.due.date, { zone: timeZone }).toJSDate();
        const dateB = DateTime.fromISO(b.due.datetime || b.due.date, { zone: timeZone }).toJSDate();
        return dateA - dateB;
    });

    return dueTasks;
}
