import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";
import { fetchDynalistDocument } from "./dynalistApi";

export function processNode(node, data) {
    const { checked, ...filteredNode } = node;

    if (checked) return null;

    if (node.children && node.children.length > 0) {
        filteredNode.children = node.children
            .map((childId) => {
                const child = data.nodes.find((node) => node.id === childId);

                return child ? processNode(child, data) : null;
            })
            .filter((child) => child !== null);
    }

    return filteredNode;
}

export function getDynalistType(note) {
    const validTypes = ["read", "checklist", "rotating", "crossoff"];
    const firstWordMatch = note && note.match(/^count \d+(\/|$)[\s\S]*$/);

    if (validTypes.includes(note) || firstWordMatch) {
        return firstWordMatch ? "count" : note;
    }
    return "read";
}

export async function loadDynalistComment(url) {
    const accessToken = get(dynalistAccessToken);
    const {
        data,
        dynalistSubItem,
        error: fetchError,
    } = await fetchDynalistDocument(url, accessToken);
    if (fetchError) {
        return { error: fetchError };
    }
    data.nodes.forEach((node) => {
        if (node.content) node.content = node.content.replace(/__(.*?)__/g, "_$1_");
    });

    const rootNode = data.nodes.find((node) => node.id === (dynalistSubItem || "root"));

    if (!rootNode) {
        return { error: new Error("Specified node not in document.") };
    }

    const dynalistObject = processNode(rootNode, data);
    if (!dynalistObject) {
        return { error: new Error("Processed Dynalist node is null.") };
    }

    dynalistObject.file_id = data.file_id;
    const selectedType = getDynalistType(dynalistObject.note);
    return { dynalistObject, selectedType };
}

export function generateDynalistComment(node, indent = 0) {
    if (!node || !Array.isArray(node.children)) return "";

    const processNodeContent = (node, level) => {
        const markdown = `${"  ".repeat(level)}- ${node.content}\n`;
        return (
            node.children?.reduce(
                (acc, child) => acc + processNodeContent(child, level + 1),
                markdown,
            ) || markdown
        );
    };

    return node.children.reduce((acc, child) => acc + processNodeContent(child, indent), "");
}

export function parseList(content) {
    return content.split("\n").reduce((result, line) => {
        if (line.startsWith("  ") && result.length > 0) {
            result[result.length - 1] += "\n" + line;
        } else {
            result.push(line.substring(2).trim());
        }
        return result;
    }, []);
}
