<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { fetchDynalistDocument, processNode, generateDynalistComment } from "../../js/dynalist";

    export let url, accessToken;

    let dynalistObject;
    let selectedType = "";

    onMount(async () => {
        try {
            const { data, dynalistSubItem } = await fetchDynalistDocument(url, accessToken);
            let rootNode;

            if (dynalistSubItem) {
                rootNode = data.nodes.find((node) => node.id === dynalistSubItem);
            } else {
                rootNode = data.nodes.find((node) => node.id === "root");
            }

            if (rootNode) {
                dynalistObject = processNode(rootNode, data);

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

{#if dynalistObject}
    <div class="relative">
        {#if selectedType === "read"}
            <Markdown
                md={generateDynalistComment(dynalistObject) ||
                    "Unsupported format, but stay tuned."}
            />
        {:else if selectedType === "checklist"}
            <!-- <DynalistChecklist {dynalistObject} /> -->
            View not supported yet.
        {:else if selectedType === "count"}
            <!-- <DynalistCount {dynalistObject} /> -->
            View not supported yet.
        {:else if selectedType === "rotating"}
            <!-- <DynalistRotating {dynalistObject} /> -->
            View not supported yet.
        {:else if selectedType === "crossoff"}
            <!-- <DynalistCrossOff {dynalistObject} /> -->
            View not supported yet.
        {/if}

        {#key selectedType}
            <DynalistTypeMenu {selectedType} on:selectType={handleTypeSelection} />
        {/key}
    </div>
{:else}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{/if}
