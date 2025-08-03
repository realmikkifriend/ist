<script lang="ts">
    import { writable } from "svelte/store";
    import Markdown from "svelte-exmarkdown";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { loadDynalistComment } from "../../../services/dynalistService";
    import { generateDynalistComment, hasError } from "../../../utils/dynalistUtils";
    import { error as showError } from "../../../services/toastService";
    import type { Writable } from "svelte/store";
    import type {
        DynalistContent,
        DynalistTaskType,
        DynalistStoreState,
    } from "../../../types/dynalist";

    export let url: string;

    const dynalistStore: Writable<DynalistStoreState> = writable({
        dynalistObject: undefined,
        selectedType: "",
        error: undefined,
    });

    const loadPromise: Promise<DynalistStoreState> = loadDynalistComment(url).then(
        (value: { dynalistObject?: DynalistContent; selectedType?: string; error?: unknown }) => {
            const { dynalistObject, selectedType, error } = value;
            if (error) {
                let errorMsg: string;
                if (hasError(error) && typeof error.error.message === "string") {
                    errorMsg = `Dynalist retrieval/processing error: ${error.error.message}`;
                } else {
                    errorMsg = `Dynalist retrieval/processing error`;
                }

                showError(errorMsg);
                console.error(errorMsg);

                return {
                    dynalistObject: undefined,
                    selectedType: "",
                };
            } else {
                const validTypes: (DynalistTaskType | "")[] = [
                    "read",
                    "checklist",
                    "count",
                    "rotating",
                    "crossoff",
                    "",
                ];
                const safeSelectedType =
                    selectedType && validTypes.includes(selectedType as DynalistTaskType | "")
                        ? (selectedType as DynalistTaskType | "")
                        : "";
                const newState: DynalistStoreState = {
                    dynalistObject,
                    selectedType: safeSelectedType,
                    error: undefined,
                };
                dynalistStore.set(newState);
                return newState;
            }
        },
    );

    /**
     * Handles selection of a Dynalist type from the menu.
     * @param event - The event containing the selected type.
     * @returns nothing, but updates Dynalist store setting
     */
    const handleTypeSelection = (event: CustomEvent<{ type: DynalistTaskType }>) =>
        dynalistStore.update((state) => ({ ...state, selectedType: event.detail.type }));

    $: if ($dynalistStore.selectedType === "" && $dynalistStore.dynalistObject) {
        dynalistStore.update((state) => ({
            ...state,
            selectedType: state.dynalistObject
                ? (loadPromise.then((result) => result.selectedType) as unknown as
                      | DynalistTaskType
                      | "")
                : "",
        }));
    }
</script>

{#await loadPromise}
    <span class="flex items-center">
        <Icon src={ArrowPath} class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{:then result}
    {#if result.dynalistObject}
        <div class="relative">
            {#if $dynalistStore.selectedType === "read"}
                <Markdown
                    md={generateDynalistComment(result.dynalistObject) ||
                        "Unsupported format, but stay tuned."}
                />
            {:else if $dynalistStore.selectedType === "checklist"}
                <DynalistChecklist content={generateDynalistComment(result.dynalistObject)} />
            {:else if $dynalistStore.selectedType === "count"}
                <DynalistCount content={result.dynalistObject} />
            {:else if $dynalistStore.selectedType === "rotating"}
                <DynalistRotating content={result.dynalistObject} />
            {:else if $dynalistStore.selectedType === "crossoff"}
                <DynalistCrossOff content={result.dynalistObject} />
            {/if}

            {#key $dynalistStore.selectedType}
                <DynalistTypeMenu
                    selectedType={$dynalistStore.selectedType === ""
                        ? "read"
                        : $dynalistStore.selectedType}
                    {url}
                    on:selectType={handleTypeSelection}
                />
            {/key}
        </div>
    {:else}
        <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
    {/if}
{/await}
