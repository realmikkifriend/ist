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
                let currentMap = new Map(
                    (currentResources[type] || []).map((entry) => [entry.id, entry]),
                );

                const activeData = data[type].filter((entry) => !entry.is_deleted);

                activeData.forEach((entry) => {
                    if (currentMap.has(entry.id)) {
                        currentMap.set(entry.id, {
                            ...currentMap.get(entry.id),
                            ...entry,
                            context_id:
                                type === "items"
                                    ? entry.project_id
                                    : currentMap.get(entry.id).context_id,
                            project_id: undefined,
                        });
                    } else {
                        currentMap.set(entry.id, {
                            ...entry,
                            context_id: type === "items" ? entry.project_id : undefined,
                            project_id: undefined,
                        });
                    }
                });
                currentResources[type] = Array.from(currentMap.values());

                currentResources[type] = currentResources[type].filter(
                    (entry) => !data[type].find((e) => e.id === entry.id && e.is_deleted),
                );
            } else if (type === "user" && data[type]) {
                currentResources[type] = { ...currentResources[type], ...data[type] };
            } else if (data[type]) {
                currentResources[type] = [...(currentResources[type] || []), ...data[type]];
            }
        });
    }
    return currentResources;
}
