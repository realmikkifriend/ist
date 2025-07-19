<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { loadDynalistComment, generateDynalistComment } from "./dynalist";
    import { error } from "../../../js/toasts";

    export let url, accessToken;

    let selectedType = "";

    const loadPromise = loadDynalistComment(url, accessToken).then(
        ({ dynalistObject: obj, selectedType: type, error: err }) => {
            if (err) {
                error(`Dynalist retrieval/processing error: ${err}`);
                console.error("Dynalist retrieval/processing error:", err);
                return { dynalistObject: undefined, selectedType: "", error: err };
            } else {
                return { dynalistObject: obj, selectedType: type, error: undefined };
            }
        },
    );

    function handleTypeSelection(event) {
        selectedType = event.detail.type;
    }
</script>

{#await loadPromise}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{:then result}
    {#if result.dynalistObject}
        <div class="relative">
            {#if selectedType === ""}
                {@html (() => {
                    selectedType = result.selectedType;
                    return "";
                })()}
            {/if}

            {#if selectedType === "read"}
                <Markdown
                    md={generateDynalistComment(result.dynalistObject) ||
                        "Unsupported format, but stay tuned."}
                />
            {:else if selectedType === "checklist"}
                <DynalistChecklist content={generateDynalistComment(result.dynalistObject)} />
            {:else if selectedType === "count"}
                <DynalistCount content={result.dynalistObject} />
            {:else if selectedType === "rotating"}
                <DynalistRotating content={result.dynalistObject} />
            {:else if selectedType === "crossoff"}
                <DynalistCrossOff content={result.dynalistObject} />
            {/if}

            {#key selectedType}
                <DynalistTypeMenu {selectedType} {url} on:selectType={handleTypeSelection} />
            {/key}
        </div>
    {:else}
        <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
    {/if}
{/await}
