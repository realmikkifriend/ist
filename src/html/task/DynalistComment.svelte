<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    export let url, accessToken;

    let dynalistContent;

    onMount(async () => {
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
            return;
        }

        let rootNode, dynalistObject;

        if (dynalistSubItem) {
            rootNode = data.nodes.find((node) => node.id === dynalistSubItem);
        } else {
            rootNode = data.nodes.find((node) => node.id === "root");
        }

        if (rootNode) {
            dynalistObject = processNode(rootNode, data);
            dynalistContent =
                generateDynalistComment(dynalistObject) || "Unsupported format, but stay tuned.";
        } else {
            console.error("Specified node not in document.");
        }
    });

    const processNode = (node, data) => {
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
    };

    const generateDynalistComment = (node, indent = 0) => {
        if (!node || !Array.isArray(node.children)) return "";

        const processNode = (node, level) => {
            const markdown = `${"  ".repeat(level)}- ${node.content}\n`;
            return (
                node.children?.reduce(
                    (acc, child) => acc + processNode(child, level + 1),
                    markdown,
                ) || markdown
            );
        };

        return node.children.reduce((acc, child) => acc + processNode(child, indent), "");
    };
</script>

{#if dynalistContent}
    <Markdown md={dynalistContent} />
{:else}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{/if}
