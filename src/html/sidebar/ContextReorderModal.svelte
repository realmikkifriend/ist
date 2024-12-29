<script>
    import { onMount } from "svelte";
    import { todoistResources } from "../../js/stores";

    let filteredContexts = [];
    let indexA;
    let indexB;
    let selectedOrder = [];
    let isComparing = true;
    let differences = [];

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

            selectedOrder.forEach((context, newIndex) => {
                const originalIndex = filteredContexts.findIndex((c) => c.id === context.id);
                if (originalIndex !== newIndex) {
                    differences.push({ id: context.id, child_order: newIndex });
                }
            });
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
                <li class="flex flex-row items-baseline">
                    {context.name}
                    {#if differences.find((difference) => difference.id === context.id)}
                        {@const childOrderDifference =
                            context.child_order -
                            differences.find((difference) => difference.id === context.id)
                                .child_order}

                        <span class="badge badge-xs ml-1 h-fit bg-neutral px-1 py-0.5">
                            {childOrderDifference > 0 ? "+" : "-"}{Math.abs(childOrderDifference)}
                        </span>
                    {/if}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
