import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";
import { fetchDynalistDocument } from "./dynalistApi";
import type {
    FetchDynalistDocumentResult,
    DynalistDocumentData,
    DynalistNode,
} from "../../../../types/dynalist";

/**
 * Recursively processes a Dynalist node, filtering out checked nodes and processing children.
 * @param {DynalistNode} node - The node to process.
 * @param {DynalistDocumentData} data - The document data containing all nodes.
 * @returns {DynalistNode | null} The processed node or null if checked.
 */
export function processNode(node: DynalistNode, data: DynalistDocumentData): DynalistNode | null {
    if (node.checked) return null;

    const { children, ...rest } = node;
    const processedNode: DynalistNode = {
        ...rest,
        note: node.note,
        content: node.content,
        checked: node.checked,
        children: undefined,
    };

    if (children && children.length > 0) {
        processedNode.children = children
            .map((childId) => {
                const child = data.nodes.find((n) => n.id === childId);
                return child ? processNode(child, data) : null;
            })
            .filter((child): child is DynalistNode => child !== null);
    }

    return processedNode;
}

/**
 * Determines the Dynalist type from a note string.
 * @param {string | undefined} note - The note to analyze.
 * @returns {string} The determined type.
 */
export function getDynalistType(note: string | undefined): string {
    const validTypes = ["read", "checklist", "rotating", "crossoff"];
    const firstWordMatch = note && note.match(/^count \d+(\/|$)[\s\S]*$/);

    if (note && (validTypes.includes(note) || firstWordMatch)) {
        return firstWordMatch ? "count" : note;
    }
    return "read";
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
 * Generates a markdown comment from a Dynalist node and its children.
 * @param {DynalistNode} node - The root node.
 * @param {number} indent - The indentation level.
 * @returns {string} The generated markdown comment.
 */
export function generateDynalistComment(node: DynalistNode, indent: number = 0): string {
    if (!node || !Array.isArray(node.children)) return "";

    const processNodeContent = (child: DynalistNode | string, level: number): string => {
        if (typeof child === "string") {
            return `${"  ".repeat(level)}- ${child}\n`;
        } else {
            const markdown =
                `${"  ".repeat(level)}- ${child.content}\n` +
                (Array.isArray(child.children)
                    ? child.children
                          .map((subChild) => processNodeContent(subChild, level + 1))
                          .join("")
                    : "");
            return markdown;
        }
    };

    return node.children.map((child) => processNodeContent(child, indent)).join("");
}

/**
 * Parses a markdown list into an array of strings, preserving indentation.
 * @param {string} content - The markdown list content.
 * @returns {string[]} The parsed list items.
 */
export function parseList(content: string): string[] {
    return content.split("\n").reduce<string[]>((result, line) => {
        if (line.startsWith("  ") && result.length > 0) {
            result[result.length - 1] += "\n" + line;
        } else {
            result.push(line.substring(2).trim());
        }
        return result;
    }, []);
}

/**
 * Returns whether the provided object has an error property.
 * @param {unknown} obj - The object to check for an error property.
 * @returns True if the object has an error property, false otherwise.
 */
export function hasError(obj: unknown): obj is { error: { message?: string } } {
    return typeof obj === "object" && obj !== null && "error" in obj;
}
