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
            if (type === "items" && data[type]) {
                const newItemsMap = new Map(data[type].map((item) => [item.id, item]));
                currentResources.items = (currentResources.items || []).map((item) => {
                    if (newItemsMap.has(item.id)) {
                        const newItem = newItemsMap.get(item.id);
                        return {
                            ...newItem,
                            context_id: newItem.project_id,
                            project_id: undefined,
                        };
                    }
                    return item;
                });
                data[type].forEach((item) => {
                    if (!newItemsMap.has(item.id)) {
                        currentResources.items.push({
                            ...item,
                            context_id: item.project_id,
                            project_id: undefined,
                        });
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
