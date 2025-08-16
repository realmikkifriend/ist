import type { DynalistNode, DynalistDocumentData, DynalistCountData } from "../types/dynalist";

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
    if (!note) {
        return "read";
    }

    const firstWord = note.split(" ")[0];

    const validTypes = ["read", "checklist", "count", "rotating", "crossoff", "tracking"];
    if (validTypes.includes(firstWord)) {
        return firstWord;
    }

    return "read";
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
 * Parses count data from a Dynalist note string.
 * @param {string} note - The note string to parse.
 * @returns {DynalistCountData} The parsed count data.
 */
export const parseCountData = (note: string): DynalistCountData => {
    const match = note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/);
    if (!match) {
        return { total: 0, current: 0 };
    }
    const [totalStr, currentStr, date] = match.slice(1);
    const total = totalStr !== undefined ? parseInt(totalStr, 10) : 0;
    const current = currentStr !== undefined ? parseInt(currentStr, 10) : 0;
    return {
        total,
        current,
        ...(date ? { date } : {}),
    };
};
