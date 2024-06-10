export function processTodoistData(currentResources, data, RESOURCE_TYPES) {
    const propsToRemove = [
        "added_at",
        "added_by_uid",
        "assigned_by_uid",
        "checked",
        "child_order",
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

    function removeProps(item, props) {
        props.forEach((prop) => delete item[prop]);
        return item;
    }

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
                ...removeProps(item, propsToRemove),
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
                        const updatedEntry =
                            type === "items"
                                ? removeProps(
                                      { ...currentMap.get(entry.id), ...entry },
                                      propsToRemove,
                                  )
                                : { ...currentMap.get(entry.id), ...entry };
                        currentMap.set(entry.id, {
                            ...updatedEntry,
                            context_id:
                                type === "items"
                                    ? entry.project_id
                                    : currentMap.get(entry.id).context_id,
                            project_id: undefined,
                        });
                    } else {
                        const newEntry =
                            type === "items"
                                ? removeProps({ ...entry }, propsToRemove)
                                : { ...entry };
                        currentMap.set(entry.id, {
                            ...newEntry,
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
