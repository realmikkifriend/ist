<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { generateDynalistComment } from "../../../utils/dynalistUtils";
    import type { DynalistContent, DynalistTaskType } from "../../../types/dynalist";

    export let dynalistObject: DynalistContent;
    export let selectedType: DynalistTaskType | "";
    export let url: string;

    const dispatch = createEventDispatcher<{
        selectType: { type: DynalistTaskType };
    }>();

    /**
     * Handles selection of a Dynalist type from the menu.
     * @param event - The event containing the selected type.
     */
    const handleTypeSelection = (event: CustomEvent<{ type: DynalistTaskType }>) => {
        dispatch("selectType", event.detail);
    };
</script>

<div class="relative">
    {#if selectedType === "read"}
        <Markdown
            md={generateDynalistComment(dynalistObject) || "Unsupported format, but stay tuned."}
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
        <DynalistTypeMenu
            selectedType={selectedType === "" ? "read" : selectedType}
            {url}
            on:selectType={handleTypeSelection}
        />
    {/key}
</div>
