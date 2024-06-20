<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { BackwardIcon } from "@krowten/svelte-heroicons";
    import { parseList } from "./dynalist";
    export let content;

    let checklistItems,
        buttonElement,
        currentIndex = 0;

    onMount(() => {
        checklistItems = parseList(content);
    });

    function showNextItem() {
        buttonElement.classList.add("bg-secondary");

        setTimeout(() => {
            if (currentIndex < checklistItems.length - 1) {
                currentIndex++;
                buttonElement.classList.remove("bg-secondary");
            }
        }, 200);
    }
</script>

{#if checklistItems && currentIndex < checklistItems.length - 1}
    <div class="text-primary-content">
        <button
            bind:this={buttonElement}
            class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer border-2 border-primary-content transition-colors"
            on:click={showNextItem}
        />
        <Markdown md={checklistItems[currentIndex]} />
    </div>
{:else}
    <span class="italic">No items in list!</span>
{/if}
