<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { ArrowUturnDownIcon } from "@krowten/svelte-heroicons";
    import { generateDynalistComment } from "./dynalist";
    export let content;

    let checklistItems,
        buttonElement,
        currentIndex = 0;

    onMount(() => {
        checklistItems = content.children;
    });

    function showNextItem() {
        buttonElement.classList.add("animate-ping");

        setTimeout(() => {
            const itemToMove = checklistItems.splice(0, 1)[0];
            checklistItems = [...checklistItems, itemToMove];
            buttonElement.classList.remove("animate-ping");
        }, 350);
    }
</script>

{#key checklistItems}
    {#if checklistItems?.length > 0}
        <div class="text-primary-content">
            <button
                bind:this={buttonElement}
                class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer rounded bg-primary p-1 pb-5 pr-5"
                on:click={showNextItem}><ArrowUturnDownIcon class="h-4 w-4" /></button
            >
            <Markdown
                md={`${checklistItems[0].content}\n${generateDynalistComment(checklistItems[0])}`}
            />
        </div>
    {:else}
        <span class="italic">No items in list!</span>
    {/if}
{/key}
