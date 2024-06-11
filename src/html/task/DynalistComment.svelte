<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { fetchDynalistDocument, processNode, generateDynalistComment } from "../../js/dynalist";

    export let url, accessToken;

    let dynalistContent;
    let selectedType = "";

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

                const validTypes = ["read", "checklist", "count", "rotating", "crossoff"];
                selectedType = validTypes.includes(dynalistObject.note)
                    ? dynalistObject.note
                    : "read";
            } else {
                console.error("Specified node not in document.");
            }
        } catch (error) {
            console.error("Error during Dynalist document retrieval or processing:", error);
        }
    });

    function handleTypeSelection(event) {
        selectedType = event.detail.type;
    }
</script>

{#if dynalistContent}
    <div class="relative">
        <Markdown md={dynalistContent} />

        {#key selectedType}
            <DynalistTypeMenu {selectedType} on:selectType={handleTypeSelection} />
        {/key}
    </div>
{:else}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{/if}
