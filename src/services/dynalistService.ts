import { get } from "svelte/store";
import { dynalistAccessToken } from "../stores/secret";
import { loadDynalistComment } from "../utils/dynalistApiGetUtils";
import { updateDynalist } from "../utils/dynalistApiPostUtils";
import { success } from "./toastService";
import type { DynalistApiResultBase, DynalistContent, DynalistCountData } from "../types/dynalist";
import type { DynalistNode } from "../types/dynalist";
import { DateTime } from "luxon";

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
    const result = await updateDynalist(file_id, changes, accessToken);
    return result;
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
 * Handles the click for Dynalist tracking, updating the node.
 * @param {DynalistNode} content - The Dynalist node content.
 * @param {boolean} todayTracked - Whether today is already tracked.
 * @returns {Promise<DynalistNode["children"]>} The updated children of the node.
 */
export async function handleDynalistTrackingClick(
    content: DynalistNode,
    todayTracked: boolean,
): Promise<DynalistNode["children"]> {
    const today = DateTime.now().toISODate();
    const changeAction = todayTracked
        ? {
              action: "delete" as const,
              node_id: (
                  content.children?.find(
                      (c) => typeof c !== "string" && c.content === today,
                  ) as DynalistNode
              )?.id,
          }
        : {
              action: "insert" as const,
              parent_id: content.id,
              index: 0,
              content: today,
          };

    if (changeAction.action === "delete" && !changeAction.node_id) {
        return content.children;
    }

    const result = await updateDynalistWithToken(content.file_id, [changeAction]);

    const existingNodes = (content.children ?? []).filter(
        (c): c is DynalistNode => typeof c !== "string",
    );

    if (changeAction.action === "delete") {
        success("Removed date from Dynalist!");
        return existingNodes.filter((c) => c.content !== today);
    } else {
        success("Added date to Dynalist!");
        const newNode: DynalistNode = {
            id: result.new_node_ids?.[0] || "temp-id",
            file_id: content.file_id,
            content: today,
            children: [],
        };
        return [...existingNodes, newNode];
    }
}
