export function processTodoistData(currentResources, data, RESOURCE_TYPES) {
    if (data.full_sync) {
        RESOURCE_TYPES.forEach((type) => {
            if (type === "projects") {
                currentResources.contexts = data[type] || [];
            } else if (type === "user") {
                currentResources[type] = data[type];
            } else {
                currentResources[type] = data[type] || [];
            }
        });

        if (currentResources.items) {
            currentResources.items = currentResources.items.map((item) => ({
                ...item,
                context_id: item.project_id,
                project_id: undefined,
            }));
        }
    } else {
        RESOURCE_TYPES.forEach((type) => {
            if ((type === "items" || type === "notes") && data[type]) {
                const newMap = new Map(data[type].map((entry) => [entry.id, entry]));
                currentResources[type] = (currentResources[type] || []).map((entry) => {
                    if (newMap.has(entry.id)) {
                        const newEntry = newMap.get(entry.id);
                        if (type === "items") {
                            return {
                                ...newEntry,
                                context_id: newEntry.project_id,
                                project_id: undefined,
                            };
                        }
                        return newEntry;
                    }
                    return entry;
                });
                data[type].forEach((entry) => {
                    if (!newMap.has(entry.id)) {
                        if (type === "items") {
                            currentResources[type].push({
                                ...entry,
                                context_id: entry.project_id,
                                project_id: undefined,
                            });
                        } else {
                            currentResources[type].push(entry);
                        }
                    }
                });
            } else if (type === "user" && data[type]) {
                currentResources[type] = data[type];
            } else if (data[type]) {
                currentResources[type] = [...(currentResources[type] || []), ...data[type]];
            }
        });
    }
    return currentResources;
}
