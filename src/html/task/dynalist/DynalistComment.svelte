<script>
    import { writable } from "svelte/store";
    import Markdown from "svelte-exmarkdown";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import DynalistChecklist from "./DynalistChecklist.svelte";
    import DynalistCount from "./DynalistCount.svelte";
    import DynalistRotating from "./DynalistRotating.svelte";
    import DynalistCrossOff from "./DynalistCrossOff.svelte";
    import DynalistTypeMenu from "./DynalistTypeMenu.svelte";
    import { loadDynalistComment, generateDynalistComment } from "./dynalist";
    import { error } from "../../../js/toasts";

    export let url;

    const dynalistStore = writable({
        dynalistObject: undefined,
        selectedType: "",
        error: undefined,
    });

    const loadPromise = loadDynalistComment(url).then(
        ({ dynalistObject: obj, selectedType: type, error: err }) => {
            if (err) {
                const errorMsg = `Dynalist retrieval/processing error: ${err}`;
                error(errorMsg);
                console.error(errorMsg);
                const errorState = { dynalistObject: undefined, selectedType: "", error: err };
                dynalistStore.set(errorState);
                return errorState;
            } else {
                const newState = { dynalistObject: obj, selectedType: type, error: undefined };
                dynalistStore.set(newState);
                return newState;
            }
        },
    );

    const handleTypeSelection = ({ detail: { type } }) =>
        dynalistStore.update((state) => ({ ...state, selectedType: type }));

    $: if ($dynalistStore.selectedType === "" && $dynalistStore.dynalistObject) {
        dynalistStore.update((state) => ({
            ...state,
            selectedType: state.dynalistObject
                ? loadPromise.then((result) => result.selectedType)
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
                    md={generateDynalistComment($dynalistStore.dynalistObject) ||
                        "Unsupported format, but stay tuned."}
                />
            {:else if $dynalistStore.selectedType === "checklist"}
                <DynalistChecklist
                    content={generateDynalistComment($dynalistStore.dynalistObject)}
                />
            {:else if $dynalistStore.selectedType === "count"}
                <DynalistCount content={$dynalistStore.dynalistObject} />
            {:else if $dynalistStore.selectedType === "rotating"}
                <DynalistRotating content={$dynalistStore.dynalistObject} />
            {:else if $dynalistStore.selectedType === "crossoff"}
                <DynalistCrossOff content={$dynalistStore.dynalistObject} />
            {/if}

            {#key $dynalistStore.selectedType}
                <DynalistTypeMenu
                    selectedType={$dynalistStore.selectedType}
                    {url}
                    on:selectType={handleTypeSelection}
                />
            {/key}
        </div>
    {:else}
        <span class="flex items-center text-red-600"> Error loading Dynalist document. </span>
    {/if}
{/await}
