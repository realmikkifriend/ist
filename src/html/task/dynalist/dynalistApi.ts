import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";
import type {
    DynalistContent,
    DynalistApiResultBase,
    FetchDynalistDocumentResult,
    ValidateDynalistTokenResult,
} from "../../../../types/dynalist";

/**
 * Fetches a Dynalist document by URL and access token.
 * @param {string} url - The URL of the Dynalist document to fetch.
 * @param {string} accessToken - The Dynalist API access token.
 * @returns {Promise<FetchDynalistDocumentResult>} The result containing the document data or an error.
 */
export function fetchDynalistDocument(
    url: string,
    accessToken: string,
): Promise<FetchDynalistDocumentResult> {
    const lastIndex = url.lastIndexOf("/"),
        hashIndex = url.indexOf("#z=", lastIndex),
        dynalistFileID = url.slice(lastIndex + 1, hashIndex === -1 ? undefined : hashIndex),
        dynalistSubItem = hashIndex === -1 ? undefined : url.slice(hashIndex + 3);

    // eslint-disable-next-line
    return fetch("https://dynalist.io/api/v1/doc/read", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            token: accessToken,
            file_id: dynalistFileID,
        }),
    })
        .then((response) =>
            response
                .json()
                .then((data: unknown) => ({ response, data, jsonError: false }))
                .catch(() => ({ response, data: null, jsonError: true })),
        )
        .then((result) => {
            if (result.jsonError) {
                return {
                    error: "Failed to parse Dynalist response as JSON",
                    jsonError: true,
                };
            }

            const data = result.data;
            const isObj = (val: unknown): val is { _code?: string; _msg?: string } =>
                typeof val === "object" && val !== null;
            if (!result.response.ok || (isObj(data) && data._code === "NotFound")) {
                return {
                    error:
                        result.response.statusText ||
                        (isObj(data) ? data._msg : undefined) ||
                        "Dynalist document not found",
                    data: null,
                };
            }
            return { data: data as DynalistContent | null, dynalistSubItem };
        })
        .catch((error) => ({
            error: (error as Error)?.message || "Unknown error fetching Dynalist document",
        }));
}

/**
 * Updates a Dynalist document with the given changes.
 * @param {string} file_id - The Dynalist file ID.
 * @param {unknown[]} changes - The list of changes to apply.
 * @returns {Promise<DynalistApiResultBase>} The result of the update operation.
 */
export async function updateDynalist(
    file_id: string,
    changes: unknown[],
): Promise<DynalistApiResultBase> {
    const payload = {
        token: get(dynalistAccessToken),
        file_id,
        changes,
    };

    // eslint-disable-next-line
    const response = await fetch("https://dynalist.io/api/v1/doc/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data: unknown = await response.json();
    if (response.ok) {
        return { data };
    } else {
        return { error: "Network response was not ok", data };
    }
}

/**
 * Validates a Dynalist API token.
 * @param {string} token - The Dynalist API token to validate.
 * @returns {Promise<ValidateDynalistTokenResult>} The result of the validation.
 */
export async function validateDynalistToken(token: string): Promise<ValidateDynalistTokenResult> {
    if (!/^[a-zA-Z0-9_]+$/.test(token)) {
        return { success: false, error: "Invalid token format" };
    }
    // eslint-disable-next-line
    return fetch("https://dynalist.io/api/v1/pref/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, key: "inbox_location" }),
    })
        .then((response) => response.json().then((result: unknown) => ({ response, result })))
        .then(({ response, result }) => {
            const isObj = (val: unknown): val is { _code?: string } =>
                typeof val === "object" && val !== null;
            if (response.ok && isObj(result) && result._code !== "InvalidToken") {
                return { success: true };
            } else {
                // eslint-disable-next-line
                console.error("API request failed:", result);
                return { success: false, error: "Invalid token", data: result };
            }
        })
        .catch((error) => {
            // eslint-disable-next-line
            console.error("Network or other error:", error);
            return { success: false, error: "Network or other error" };
        });
}
