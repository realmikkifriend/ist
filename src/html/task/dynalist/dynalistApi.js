import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";

/**
 * Fetches a Dynalist document by URL and access token.
 * @param {string} url
 * @param {string} accessToken
 * @returns {Promise<{data: any, dynalistSubItem: string, error?: Error}>}
 */
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

/**
 * Updates a Dynalist document.
 * @param {string} file_id
 * @param {Array} changes
 * @returns {Promise<{error: boolean, data?: any, message?: string}>}
 */
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
