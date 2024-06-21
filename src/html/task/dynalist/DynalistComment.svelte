<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { fetchDynalistDocument, processNode, generateDynalistComment } from "./dynalist";
    import { error } from "../../../js/toasts";

    export let url, accessToken;

    let dynalistObject;
    let selectedType = "";

    onMount(async () => {
        try {
            const { data, dynalistSubItem } = await fetchDynalistDocument(url, accessToken);
            let rootNode;

            rootNode = data.nodes.find((node) => node.id === (dynalistSubItem || "root"));

            if (rootNode) {
                dynalistObject = processNode(rootNode, data);
                dynalistObject.file_id = data.file_id;

                const validTypes = ["read", "checklist", "rotating", "crossoff"];
                const firstWordMatch = dynalistObject.note.match(/^count \d+(\/|$)[\s\S]*$/);

                selectedType =
                    validTypes.includes(dynalistObject.note) || firstWordMatch
                        ? firstWordMatch
                            ? "count"
                            : dynalistObject.note
                        : "read";
            } else {
                console.error("Specified node not in document.");
            }
        } catch (e) {
            error(`Dynalist retrieval/processing error: ${e}`);
            console.error("Dynalist retrieval/processing error:", e);
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
            <DynalistChecklist content={generateDynalistComment(dynalistObject)} />
        {:else if selectedType === "count"}
            <DynalistCount content={dynalistObject} />
        {:else if selectedType === "rotating"}
            <DynalistRotating content={dynalistObject} />
        {:else if selectedType === "crossoff"}
            <DynalistCrossOff content={dynalistObject} />
        {/if}

        {#key selectedType}
            <DynalistTypeMenu {selectedType} {url} on:selectType={handleTypeSelection} />
        {/key}
    </div>
{:else}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{/if}
