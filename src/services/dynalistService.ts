import { get } from "svelte/store";
import { dynalistAccessToken } from "../stores/stores";
import type {
    FetchDynalistDocumentResult,
    DynalistDocumentData,
    DynalistNode,
    DynalistContent,
    DynalistApiResultBase,
    ValidateDynalistTokenResult,
    DynalistCountData,
} from "../types/dynalist";
import { success } from "./toastService";
import { processNode, getDynalistType } from "../utils/dynalistUtils";

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
                    error: result.response.statusText || (isObj(data) ? data._msg : undefined),
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
export function updateDynalist(
    file_id: string,
    changes: unknown[],
): Promise<DynalistApiResultBase> {
    const payload = {
        token: get(dynalistAccessToken),
        file_id,
        changes,
    };

    return fetch("https://dynalist.io/api/v1/doc/edit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
        .then((response) =>
            response
                .json()
                .then((data: unknown) => ({ response, data, jsonError: false }))
                .catch(() => ({ response, data: null, jsonError: true })),
        )
        .then((result) => {
            if (result.jsonError) {
                return { error: "Failed to parse Dynalist response as JSON" };
            }

            const data = result.data;

            if (result.response.ok) {
                return { data };
            } else {
                return { error: "Network response was not ok", data };
            }
        })
        .catch((error) => ({
            error: (error as Error)?.message || "Network or other error during update",
        }));
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
                console.error("API request failed:", result);
                return { success: false, error: "Invalid token", data: result };
            }
        })
        .catch((error) => {
            console.error("Network or other error:", error);
            return { success: false, error: "Network or other error" };
        });
}

/**
 * Loads and processes a Dynalist comment from a document URL.
 * @param {string} url - The Dynalist document URL.
 * @returns {Promise<{ dynalistObject?: DynalistNode; selectedType?: string; error?: unknown }>} The processed comment and type, or error.
 */
export async function loadDynalistComment(
    url: string,
): Promise<{ dynalistObject?: DynalistNode; selectedType?: string; error?: unknown }> {
    const accessToken = get(dynalistAccessToken);
    const {
        data,
        dynalistSubItem,
        error: fetchError,
    }: FetchDynalistDocumentResult = await fetchDynalistDocument(url, accessToken);
    if (fetchError) {
        return { error: fetchError };
    }
    if (!data || !("nodes" in data)) {
        return { error: new Error("Invalid Dynalist data structure.") };
    }
    (data as unknown as DynalistDocumentData).nodes.forEach((node) => {
        if (node.content) node.content = node.content.replace(/__(.*?)__/g, "_$1_");
    });

    const rootNode = (data as unknown as DynalistDocumentData).nodes.find(
        (node) => node.id === (dynalistSubItem || "root"),
    );

    if (!rootNode) {
        return { error: new Error("Specified node not in document.") };
    }

    const dynalistObject = processNode(rootNode, data as unknown as DynalistDocumentData);
    if (!dynalistObject) {
        return { error: new Error("Processed Dynalist node is null.") };
    }

    const dynalistObjectWithFileId = {
        ...dynalistObject,
        file_id: (data as unknown as DynalistDocumentData).file_id,
    };
    const selectedType = getDynalistType(dynalistObject.note);
    return { dynalistObject: dynalistObjectWithFileId, selectedType };
}

/**
 * Handles updating the count for a Dynalist node.
 * @param {string} option - The option string (e.g., "+1", "-1").
 * @param {DynalistCountData} countData - The current count data.
 * @param {DynalistContent} content - The Dynalist node content.
 * @returns {Promise<DynalistCountData>} The updated count data.
 */
export async function handleCount(
    option: string,
    countData: DynalistCountData,
    content: DynalistContent,
): Promise<DynalistCountData> {
    const todayFormatted = new Date().toLocaleDateString("en-CA");
    const increment = +option.slice(1);
    const updatedData: DynalistCountData = {
        ...countData,
        current: countData.current + increment,
    };
    const changes = [
        {
            action: "edit",
            node_id: content.id,
            note: `count ${updatedData.total}/${updatedData.current} ${todayFormatted}`,
        },
    ];

    await updateDynalist(content.file_id, changes);

    success("Updated count!");

    return updatedData;
}
