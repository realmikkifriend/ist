export async function fetchDynalistDocument(url, accessToken) {
    const lastIndex = url.lastIndexOf("/"),
        hashIndex = url.indexOf("#z=", lastIndex),
        dynalistFileID = url.slice(lastIndex + 1, hashIndex),
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
            throw new Error(`Error fetching the document: ${response.statusText}`);
        }

        data = await response.json();
    } catch (error) {
        console.error("Failed to retrieve the Dynalist document:", error);
        throw error;
    }

    return { data, dynalistSubItem };
}

export function processNode(node, data) {
    const { created, modified, collapsed, ...filteredNode } = node;

    if (node.children && node.children.length > 0) {
        filteredNode.children = node.children
            .map((childId) => {
                let child = data.nodes.find((node) => node.id === childId);

                if (child) {
                    return processNode(child, data);
                }

                return null;
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
