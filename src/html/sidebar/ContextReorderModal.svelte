<script>
    import { onMount } from "svelte";
    import { todoistResources } from "../../js/stores";

    let filteredContexts = [];
    let indexA;
    let indexB;
    let selectedOrder = [];
    let isComparing = true;

    $: filteredContexts = $todoistResources.contexts.filter((context) => !context.inbox_project);

    onMount(() => {
        indexB = filteredContexts.length - 1;
        indexA = filteredContexts.length - 2;
    });

    function selectHigher(selectedIndex) {
        if (selectedIndex === indexA) {
            selectedOrder.push(filteredContexts[indexB]);
            indexB = indexA;
        } else {
            selectedOrder.push(filteredContexts[indexA]);
        }

        if (indexA > 0) {
            indexA--;
        } else {
            selectedOrder.push(filteredContexts[selectedIndex]);

            isComparing = false;
            selectedOrder.reverse();
        }
    }
</script>

<div class="modal-box flex w-fit min-w-[40%] flex-col items-center bg-base-100">
    {#if isComparing}
        <h2 class="mb-4">Rank Contexts</h2>
        <div class="flex space-x-4">
            {#if indexA >= 0}
                <button class="btn bg-neutral" on:click={() => selectHigher(indexA)}>
                    {filteredContexts[indexA].name}
                </button>
                <button class="btn bg-neutral" on:click={() => selectHigher(indexB)}>
                    {filteredContexts[indexB].name}
                </button>
            {/if}
        </div>
    {:else}
        <h2 class="mb-4">Your re-ranked contexts:</h2>
        <ul class="flex flex-col items-center space-y-2">
            {#each selectedOrder as context}
                <li>{context.name}</li>
            {/each}
        </ul>
    {/if}
</div>

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
