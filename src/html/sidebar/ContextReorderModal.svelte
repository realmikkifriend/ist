<script>
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import { todoistData, todoistAccessToken, todoistError } from "../../js/stores";
    import { sendReorderedContexts, refreshData } from "../../js/api";

    let filteredContexts = [],
        originalContexts = [],
        selectedOrder = [],
        differences = [];
    let indexA, indexB;
    let isComparing = true;

    function resetAll() {
        filteredContexts = $todoistData.contexts
            .filter((context) => !context.inboxProject)
            .map((context, index) => {
                return {
                    ...context,
                    childOrder: index,
                };
            });
        originalContexts = [...filteredContexts];

        indexB = filteredContexts.length - 1;
        indexA = filteredContexts.length - 2;

        selectedOrder = [];
        differences = [];
        isComparing = true;
    }

    export let modalOpen;

    $: if (!modalOpen || ($todoistData.contexts && isComparing)) {
        resetAll();
    }

    onMount(() => {
        resetAll();
    });

    function selectHigher(selectedIndex) {
        if (selectedIndex === indexA) {
            selectedOrder.push(filteredContexts[indexB]);
        } else {
            if (selectedOrder.length > 0) {
                [filteredContexts[indexB], filteredContexts[indexB - 1]] = [
                    filteredContexts[indexB - 1],
                    filteredContexts[indexB],
                ];

                selectedOrder.pop();
                indexA += 2;
                indexB += 2;
            } else {
                selectedOrder.push(filteredContexts[indexA]);

                if (indexB > 0) {
                    [filteredContexts[indexB], filteredContexts[indexB - 1]] = [
                        filteredContexts[indexB - 1],
                        filteredContexts[indexB],
                    ];
                }
            }
        }

        if (indexA === 0) {
            selectedOrder.push(filteredContexts[selectedIndex]);

            isComparing = false;
            selectedOrder.reverse();

            selectedOrder.forEach((context, newIndex) => {
                const originalIndex = originalContexts.findIndex((c) => c.id === context.id);
                if (originalIndex !== newIndex) {
                    differences.push({ id: context.id, childOrder: newIndex });
                }
            });

            if (differences.length > 0) {
                sendReorderedContextsToApi();
            }
        } else {
            indexA--;
            indexB--;

            while (
                indexA > 0 &&
                filteredContexts[indexB].childOrder < filteredContexts[indexA].childOrder
            ) {
                selectedOrder.push(filteredContexts[indexB]);
                indexA--;
                indexB--;
            }
        }
    }

    async function sendReorderedContextsToApi() {
        let accessToken = get(todoistAccessToken);
        if (!accessToken) {
            todoistError.set("No access token found.");
            throw new Error("No access token found.");
        }
        try {
            await sendReorderedContexts(differences, accessToken);
        } catch (error) {
            todoistError.set(`Failed to send reordered contexts: ${error.message}`);
            return;
        }

        refreshData();
    }
</script>

<div class="modal-box flex w-fit min-w-[30%] flex-col items-center bg-base-100">
    {#if isComparing}
        <h2 class="mb-4 font-bold">Rank Contexts</h2>
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
        <h2 class="mb-4 font-bold">Your re-ranked contexts:</h2>
        <ul class="flex flex-col items-center space-y-2">
            {#each selectedOrder as context}
                <li class="flex flex-row items-baseline">
                    {context.name}
                    {#if differences.find((difference) => difference.id === context.id)}
                        {@const childOrderDifference =
                            context.childOrder -
                            differences.find((difference) => difference.id === context.id)
                                .childOrder}

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
