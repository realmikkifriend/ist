import { DateTime } from "luxon";
import { createDateWithTime } from "./time";
import { handleTaskDefer } from "../js/taskHandlers";

const propsToRemove = [
    "added_at",
    "added_by_uid",
    "assigned_by_uid",
    "checked",
    "collapsed",
    "completed_at",
    "day_order",
    "description",
    "labels",
    "parent_id",
    "responsible_uid",
    "section_id",
    "sync_id",
    "updated_at",
    "user_id",
    "v2_id",
    "v2_parent_id",
    "v2_project_id",
    "v2_section_id",
];

function removeProps(task, props) {
    props.forEach((prop) => delete task[prop]);
    return task;
}

function processFullSync(currentResources, data, RESOURCE_TYPES) {
    RESOURCE_TYPES.forEach((type) => {
        if (type === "projects") {
            currentResources.contexts = data[type] || [];
        } else if (type === "user") {
            currentResources[type] = data[type];
        } else {
            const currentMap = new Map(
                (currentResources[type] || []).map((entry) => [entry.id, entry]),
            );
            (data[type] || []).forEach((entry) => {
                const currentEntry = currentMap.get(entry.id);
                currentMap.set(
                    entry.id,
                    currentEntry ? { ...currentEntry, ...entry } : { ...entry },
                );
            });
            currentResources[type] = Array.from(currentMap.values());
        }
    });

    if (currentResources.items) {
        currentResources.items = currentResources.items.map((task) => ({
            ...removeProps(task, propsToRemove),
            context_id: task.project_id,
            project_id: undefined,
        }));
    }
}

function mergeData(currentResources, data, type) {
    if (type === "items" || type === "notes") {
        let currentMap = new Map((currentResources[type] || []).map((entry) => [entry.id, entry]));
        data[type]
            .filter((entry) => !entry.is_deleted)
            .forEach((entry) => {
                const currentEntry = currentMap.get(entry.id);
                const mergedEntry = currentEntry ? { ...currentEntry, ...entry } : { ...entry };
                const updatedEntry =
                    type === "items" ? removeProps(mergedEntry, propsToRemove) : mergedEntry;
                currentMap.set(entry.id, {
                    ...updatedEntry,
                    context_id: type === "items" ? entry.project_id : currentEntry?.context_id,
                    project_id: undefined,
                });
            });

        currentResources[type] = Array.from(currentMap.values()).filter(
            (entry) => !data[type].find((e) => e.id === entry.id && e.is_deleted),
        );
    } else if (type === "projects") {
        let currentMap = new Map(
            (currentResources.contexts || []).map((entry) => [entry.id, entry]),
        );
        data.projects.forEach((entry) => {
            const currentEntry = currentMap.get(entry.id);
            currentMap.set(entry.id, currentEntry ? { ...currentEntry, ...entry } : { ...entry });
        });
        currentResources.contexts = Array.from(currentMap.values());
    } else {
        const currentMap = new Map(
            Array.isArray(currentResources[type])
                ? currentResources[type].map((entry) => [entry.id, entry])
                : [],
        );

        const dataEntries = Array.isArray(data[type]) ? data[type] : [];
        dataEntries.forEach((entry) => {
            const currentEntry = currentMap.get(entry.id);
            currentMap.set(entry.id, currentEntry ? { ...currentEntry, ...entry } : { ...entry });
        });

        currentResources[type] = Array.from(currentMap.values());
    }
}

function processPartialSync(currentResources, data, RESOURCE_TYPES) {
    RESOURCE_TYPES.forEach((type) => data[type] && mergeData(currentResources, data, type));
}

function handleOverdueTasks(currentResources) {
    const today = DateTime.now().startOf("day");
    const overdueTasks =
        currentResources?.items?.filter((resource) => {
            const dueDate =
                resource.due?.date && DateTime.fromISO(resource.due.date).startOf("day");
            return dueDate && dueDate < today;
        }) || [];

    if (overdueTasks.length > 0) {
        const taskUpdates = overdueTasks.map((task) => {
            const extracted = task.due?.string ? createDateWithTime(task.due.string, today) : null;
            const time = extracted?.newDate || today;
            return [task, time];
        });

        handleTaskDefer(taskUpdates);
    }
}

export function processTodoistData(currentResources, data, RESOURCE_TYPES) {
    if (data.full_sync) {
        processFullSync(currentResources, data, RESOURCE_TYPES);
    } else {
        processPartialSync(currentResources, data, RESOURCE_TYPES);
    }

    currentResources.contexts.sort((a, b) => a.child_order - b.child_order);

    handleOverdueTasks(currentResources);

    return currentResources;
}

export function cleanTodoistData(data) {
    return data;
}
