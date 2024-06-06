import { DateTime } from "luxon";
import { v4 as uuidv4 } from "uuid";

export async function fetchTodoistData(resourceTypes, syncToken, accessToken) {
    const response = await fetch("https://api.todoist.com/sync/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
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
    return data;
}

export async function markTaskDone(taskID, accessToken) {
    const response = await fetch("https://api.todoist.com/sync/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            commands: JSON.stringify([
                {
                    type: "item_close",
                    uuid: uuidv4(),
                    args: {
                        id: taskID,
                    },
                },
            ]),
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

export async function deferTask(task, time, accessToken) {
    const taskNewDate =
        task.due.is_all_day === 1
            ? time.toFormat("yyyy-MM-dd")
            : time.toFormat("yyyy-MM-dd'T'HH:mm:ss");

    const response = await fetch("https://todoist.com/api/v9/sync", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: new URLSearchParams({
            commands: JSON.stringify([
                {
                    type: "item_update",
                    uuid: uuidv4(),
                    args: {
                        id: task.id,
                        due: {
                            date: taskNewDate,
                            datetime: taskNewDate,
                            string: task.due.string,
                        },
                    },
                },
            ]),
        }),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
}
