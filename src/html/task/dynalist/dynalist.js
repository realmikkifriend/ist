import { get } from "svelte/store";
import { dynalistAccessToken } from "../../../js/stores";

export async function fetchDynalistDocument(url, accessToken) {
    const lastIndex = url.lastIndexOf("/"),
        hashIndex = url.indexOf("#z=", lastIndex),
        dynalistFileID = url.slice(lastIndex + 1, hashIndex === -1 ? undefined : hashIndex),
        dynalistSubItem = hashIndex === -1 ? undefined : url.slice(hashIndex + 3);

    let data;

    try {
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

        if (!response.ok) {
            throw new Error(`${response.statusText}`);
        }

        data = await response.json();

        if (data._code === "NotFound") {
            throw new Error(data._msg);
        }
    } catch (error) {
        throw data._msg;
    }

    return { data, dynalistSubItem };
}

export function processNode(node, data) {
    const { created, modified, collapsed, checked, ...filteredNode } = node;

    if (checked) return null;

    if (node.children && node.children.length > 0) {
        filteredNode.children = node.children
            .map((childId) => {
                let child = data.nodes.find((node) => node.id === childId);

                return child ? processNode(child, data) : null;
            })
            .filter((child) => child !== null);
    }

    return filteredNode;
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

export async function updateDynalist(file_id, changes) {
    const payload = {
        token: get(dynalistAccessToken),
        file_id,
        changes,
    };

    try {
        const response = await fetch("https://dynalist.io/api/v1/doc/edit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        await response.json();
    } catch (error) {
        console.error("Failed to add note to Dynalist API", error);
    }
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
