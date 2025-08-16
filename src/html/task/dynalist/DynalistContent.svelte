<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import DynalistChecklist from "./interface/DynalistChecklist.svelte";
    import DynalistCount from "./interface/DynalistCount.svelte";
    import DynalistRotating from "./interface/DynalistRotating.svelte";
    import DynalistCrossOff from "./interface/DynalistCrossOff.svelte";
    import DynalistTracking from "./interface/DynalistTracking.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { generateDynalistComment } from "../../../utils/dynalistProcessUtils";
    import type { DynalistTaskType, DynalistViewProps } from "../../../types/dynalist";

    let {
        dynalistObject,
        selectedType,
        url,
        onTypeChange,
    }: DynalistViewProps & { onTypeChange: (type: DynalistTaskType) => void } = $props();

    /**
     * Handles selection of a Dynalist type from the menu.
     * @param event - The event containing the selected type.
     */
    const handleTypeSelection = (event: CustomEvent<{ type: DynalistTaskType }>) => {
        onTypeChange(event.detail.type);
    };
</script>

<div class="relative">
    {#if dynalistObject}
        {#if selectedType === "read"}
            <SvelteMarkdown
                source={generateDynalistComment(dynalistObject) ||
                    "Unsupported format, but stay tuned."}
            />
        {:else if selectedType === "checklist"}
            <DynalistChecklist content={generateDynalistComment(dynalistObject)} />
        {:else if selectedType === "count"}
            <DynalistCount {dynalistObject} />
        {:else if selectedType === "rotating"}
            <DynalistRotating {dynalistObject} />
        {:else if selectedType === "crossoff"}
            <DynalistCrossOff {dynalistObject} />
        {:else if selectedType === "tracking"}
            <DynalistTracking {dynalistObject} />
        {/if}

        {#key selectedType}
            <DynalistTypeMenu
                selectedType={selectedType || "read"}
                url={url || ""}
                on:selectType={handleTypeSelection}
            />
        {/key}
    {/if}
</div>
