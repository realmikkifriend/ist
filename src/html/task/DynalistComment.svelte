<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { fetchDynalistDocument, processNode, generateDynalistComment } from "../../js/dynalist";

    export let url, accessToken;

    let dynalistContent;

    onMount(async () => {
        try {
            const { data, dynalistSubItem } = await fetchDynalistDocument(url, accessToken);
            let rootNode, dynalistObject;

            if (dynalistSubItem) {
                rootNode = data.nodes.find((node) => node.id === dynalistSubItem);
            } else {
                rootNode = data.nodes.find((node) => node.id === "root");
            }

            if (rootNode) {
                dynalistObject = processNode(rootNode, data);
                dynalistContent =
                    generateDynalistComment(dynalistObject) ||
                    "Unsupported format, but stay tuned.";
            } else {
                console.error("Specified node not in document.");
            }
        } catch (error) {
            console.error("Error during Dynalist document retrieval or processing:", error);
        }
    });
</script>

{#if dynalistContent}
    <div class="relative">
        <Markdown md={dynalistContent} />

        <DynalistTypeMenu />
    </div>
{:else}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{/if}
