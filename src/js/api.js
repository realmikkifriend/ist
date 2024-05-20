export async function fetchTodoistData(todoistAccessToken, resourceTypes) {
    let resources = {};
    let dueTasks = [];
    let syncToken = "*";
    let error = null;

    try {
        const response = await fetch("https://api.todoist.com/sync/v9/sync", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${todoistAccessToken}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                sync_token: syncToken,
                resource_types: JSON.stringify(resourceTypes),
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        syncToken = data.sync_token;

        resourceTypes.forEach((type) => {
            resources[type] = data[type] || [];
        });

        let overdue = 0;
        dueTasks = resources["items"].filter((task) => {
            if (task.due == null) {
                return false;
            }
            task.due.all_day = task.due.datetime ? 0 : 1;
            task.due.date_object = new Date(task.due.datetime || task.due.date);
            if (task.due.date_object < new Date()) {
                overdue = 1;
            }
            return task.due.date_object < new Date();
        });

        dueTasks.sort((a, b) => {
            const c = new Date(a.due.datetime || a.due.date),
                d = new Date(b.due.datetime || b.due.date);
            return c - d;
        });
        resources["dueTasks"] = dueTasks;
    } catch (err) {
        error = err.message;
    }

    return { resources, error };
}
