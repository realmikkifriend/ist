<script>
    import Markdown from "svelte-exmarkdown";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { onMount } from "svelte";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { loadDynalistComment, generateDynalistComment } from "./dynalist";
    import { error } from "../../../js/toasts";

    export let url, accessToken;

    let dynalistObject;
    let selectedType = "";
    let loading = true;

    onMount(async () => {
        loading = true;
        const {
            dynalistObject: obj,
            selectedType: type,
            error: err,
        } = await loadDynalistComment(url, accessToken);
        if (err) {
            error(`Dynalist retrieval/processing error: ${err}`);
            console.error("Dynalist retrieval/processing error:", err);
            dynalistObject = undefined;
            selectedType = "";
        } else {
            dynalistObject = obj;
            selectedType = type;
        }
        loading = false;
    });

    function handleTypeSelection(event) {
        selectedType = event.detail.type;
    }
</script>

{#if loading}
    <span class="flex items-center">
        <ArrowPathIcon class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{:else if dynalistObject}
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
    <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
{/if}
