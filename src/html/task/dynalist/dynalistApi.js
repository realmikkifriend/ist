import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";

export async function fetchDynalistDocument(url, accessToken) {
    const lastIndex = url.lastIndexOf("/"),
        hashIndex = url.indexOf("#z=", lastIndex),
        dynalistFileID = url.slice(lastIndex + 1, hashIndex === -1 ? undefined : hashIndex),
        dynalistSubItem = hashIndex === -1 ? undefined : url.slice(hashIndex + 3);

    const response = await fetch("https://dynalist.io/api/v1/doc/read", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: accessToken,
            file_id: dynalistFileID,
        }),
    });

    const data = await response.json();

    if (!response.ok || data._code === "NotFound") {
        return { error: new Error(response.statusText || data._msg) };
    }

    return { data, dynalistSubItem };
}

export async function updateDynalist(file_id, changes) {
    const payload = {
        token: get(dynalistAccessToken),
        file_id,
        changes,
    };

    const response = await fetch("https://dynalist.io/api/v1/doc/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    return response.ok
        ? { error: false, data }
        : { error: true, message: "Network response was not ok" };
}

export async function handleToken(token) {
    if (!/^[a-zA-Z0-9_]+$/.test(token)) {
        return { success: false, error: "Invalid token format" };
    }
    return fetch("https://dynalist.io/api/v1/pref/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, key: "inbox_location" }),
    })
        .then((response) => response.json().then((result) => ({ response, result })))
        .then(({ response, result }) => {
            if (response.ok && result._code !== "InvalidToken") {
                return { success: true };
            } else {
                console.error("API request failed:", result);
                return { success: false, error: "Invalid token" };
            }
        })
        .catch((error) => {
            console.error("Network or other error:", error);
            return { success: false, error: "Network or other error" };
        });
}
