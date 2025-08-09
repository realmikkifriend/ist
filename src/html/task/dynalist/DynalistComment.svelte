<script lang="ts">
    import { writable } from "svelte/store";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { loadDynalistCommentWithToken } from "../../../services/dynalistService";
    import { hasError, getDynalistType } from "../../../utils/dynalistUtils";
    import DynalistContentComponent from "./DynalistContent.svelte";
    import { error as showError } from "../../../services/toastService";
    import type { Writable } from "svelte/store";
    import type {
        DynalistContent,
        DynalistTaskType,
        DynalistStoreState,
        DynalistViewProps,
    } from "../../../types/dynalist";

    let { url = "" }: DynalistViewProps = $props();

    const dynalistStore: Writable<DynalistStoreState> = writable({
        dynalistObject: undefined,
        selectedType: "",
        error: undefined,
    });

    const resolvedLoadStateStore: Writable<DynalistStoreState | undefined> = writable(undefined);

    const loadPromise: Promise<DynalistStoreState> = loadDynalistCommentWithToken(url).then(
        (value: { dynalistObject?: DynalistContent; selectedType?: string; error?: unknown }) => {
            const { dynalistObject, selectedType, error } = value;

            let newState: DynalistStoreState;

            if (error) {
                let errorMsg: string;
                if (hasError(error) && typeof error.error.message === "string") {
                    errorMsg = `Dynalist retrieval/processing error: ${error.error.message}`;
                } else {
                    errorMsg = `Dynalist retrieval/processing error`;
                }

                showError(errorMsg);
                console.error(errorMsg);

                newState = {
                    dynalistObject: undefined,
                    selectedType: "",
                    error: errorMsg,
                };
            } else {
                const safeSelectedType = getDynalistType(selectedType);

                newState = {
                    dynalistObject,
                    selectedType: safeSelectedType as DynalistTaskType | "",
                    error: undefined,
                };
            }
            dynalistStore.set(newState);
            resolvedLoadStateStore.set(newState);
            return newState;
        },
    );

    /**
     * Handles selection of a Dynalist type from the menu.
     * @param event - The event containing the selected type.
     * @returns nothing, but updates Dynalist store setting
     */
    const handleTypeSelection = (event: CustomEvent<{ type: DynalistTaskType }>) =>
        dynalistStore.update((state) => ({ ...state, selectedType: event.detail.type }));

    $effect(() => {
        if (
            $dynalistStore.selectedType === "" &&
            $dynalistStore.dynalistObject &&
            $resolvedLoadStateStore
        ) {
            const initialSelectedType = $resolvedLoadStateStore.selectedType;
            if (initialSelectedType !== "") {
                dynalistStore.update((state) => ({
                    ...state,
                    selectedType: initialSelectedType,
                }));
            }
        }
    });
</script>

{#await loadPromise}
    <span class="flex items-center">
        <Icon src={ArrowPath} class="mr-2 h-4 w-4 animate-spin" /> Retrieving Dynalist document...
    </span>
{:then result}
    {#if result.dynalistObject}
        <DynalistContentComponent
            dynalistObject={result.dynalistObject}
            selectedType={$dynalistStore.selectedType}
            {url}
            on:selectType={handleTypeSelection}
        />
    {:else}
        <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
    {/if}
{/await}
