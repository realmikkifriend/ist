<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { loadDynalistCommentWithToken } from "../../../services/dynalistService";
    import { hasError, getDynalistType } from "../../../utils/dynalistUtils";
    import DynalistContentComponent from "./DynalistContent.svelte";
    import { error as showError } from "../../../services/toastService";
    import type {
        DynalistContent,
        DynalistTaskType,
        DynalistStoreState,
        DynalistViewProps,
    } from "../../../types/dynalist";

    let { url = "" }: DynalistViewProps = $props();

    let dynalistStore: DynalistStoreState = $state({
        dynalistObject: undefined,
        selectedType: "",
        error: undefined,
    });

    let resolvedLoadStateStore: DynalistStoreState | undefined = $state(undefined);

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
            dynalistStore = newState;
            resolvedLoadStateStore = newState;
            return newState;
        },
    );

    /**
     * Handles selection of a Dynalist type from the menu.
     * @param type - The selected Dynalist type.
     * @returns nothing, but updates Dynalist store setting
     */
    const handleTypeChange = (type: DynalistTaskType) =>
        (dynalistStore = { ...dynalistStore, selectedType: type });

    $effect(() => {
        if (
            dynalistStore.selectedType === "" &&
            dynalistStore.dynalistObject &&
            resolvedLoadStateStore
        ) {
            const initialSelectedType = resolvedLoadStateStore.selectedType;
            if (initialSelectedType !== "") {
                dynalistStore = {
                    ...dynalistStore,
                    selectedType: initialSelectedType,
                };
            }
        }
    });
</script>

{#await loadPromise}
    <span class="flex items-center">
        <Icon class="mr-2 h-4 w-4 animate-spin" src={ArrowPath} /> Retrieving Dynalist document...
    </span>
{:then result}
    {#if result.dynalistObject}
        <DynalistContentComponent
            dynalistObject={result.dynalistObject}
            onTypeChange={handleTypeChange}
            selectedType={dynalistStore.selectedType}
            {url}
        />
    {:else}
        <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
    {/if}
{/await}
