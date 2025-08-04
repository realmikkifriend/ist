import { get } from "svelte/store";
import { dynalistAccessToken } from "../stores/secret";
import { loadDynalistComment } from "../utils/dynalistApiGetUtils";
import { updateDynalist } from "../utils/dynalistApiPostUtils";
import { success, error as showError } from "./toastService";
import { hasError } from "../utils/dynalistUtils";
import type { Writable } from "svelte/store";
import type {
    DynalistApiResultBase,
    DynalistContent,
    DynalistCountData,
    DynalistTaskType,
} from "../types/dynalist";
import type { DynalistStoreState, DynalistNode } from "../types/dynalist";

/**
 * Updates a Dynalist document with the given changes, retrieving the access token internally.
 * @param {string} file_id - The Dynalist file ID.
 * @param {unknown[]} changes - The list of changes to apply.
 * @returns {Promise<DynalistApiResultBase>} The result of the update operation.
 */
export async function updateDynalistWithToken(
    file_id: string,
    changes: unknown[],
): Promise<DynalistApiResultBase> {
    const accessToken = get(dynalistAccessToken);
    return updateDynalist(file_id, changes, accessToken);
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

    await updateDynalistWithToken(content.file_id, changes);

    success("Updated count!");

    return updatedData;
}

/**
 * Loads and processes a Dynalist comment from a document URL, retrieving the access token internally.
 * @param {string} url - The Dynalist document URL.
 * @returns {Promise<{ dynalistObject?: DynalistNode; selectedType?: string; error?: unknown }>} The processed comment and type, or error.
 */
export async function loadDynalistCommentWithToken(
    url: string,
): Promise<{ dynalistObject?: DynalistNode; selectedType?: string; error?: unknown }> {
    const accessToken = get(dynalistAccessToken);
    return loadDynalistComment(url, accessToken);
}

/**
 * Loads and processes a Dynalist comment from a document URL.
 * @param {string} url - The Dynalist document URL.
 * @param {Writable<DynalistStoreState>} dynalistStore - The Svelte store for Dynalist contents.
 * @returns {Promise<DynalistStoreState>} The processed comment and type, or error.
 */
export async function initializeDynalistComment(
    url: string,
    dynalistStore: Writable<DynalistStoreState>,
): Promise<DynalistStoreState> {
    const result = await loadDynalistCommentWithToken(url);
    const { dynalistObject, selectedType, error } = result;

    if (error) {
        const errorMsg =
            hasError(error) && typeof error.error.message === "string"
                ? `Dynalist retrieval/processing error: ${error.error.message}`
                : `Dynalist retrieval/processing error`;

        showError(errorMsg);
        console.error(errorMsg);

        return {
            dynalistObject: undefined,
            selectedType: "",
            error: errorMsg,
        };
    }

    const validTypes: (DynalistTaskType | "")[] = [
        "read",
        "checklist",
        "count",
        "rotating",
        "crossoff",
        "",
    ];
    const safeSelectedType =
        selectedType && validTypes.includes(selectedType as DynalistTaskType | "")
            ? (selectedType as DynalistTaskType | "")
            : "";

    const newState: DynalistStoreState = {
        dynalistObject,
        selectedType: safeSelectedType,
        error: undefined,
    };

    dynalistStore.set(newState);
    return newState;
}
