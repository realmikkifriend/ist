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
