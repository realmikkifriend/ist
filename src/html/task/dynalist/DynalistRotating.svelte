<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { ArrowUturnDownIcon } from "@krowten/svelte-heroicons";
    import { parseList } from "./dynalist";
    export let content;

    let checklistItems,
        buttonElement,
        currentIndex = 0;

    onMount(() => {
        checklistItems = parseList(content);
    });

    function showNextItem() {
        buttonElement.classList.add("animate-ping");

        setTimeout(() => {
            if (currentIndex < checklistItems.length - 1) {
                currentIndex++;
                buttonElement.classList.remove("animate-ping");
            }
        }, 350);
    }
</script>

{#if checklistItems && currentIndex < checklistItems.length - 1}
    <div class="text-primary-content">
        <button
            bind:this={buttonElement}
            class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer rounded bg-primary p-1 pb-5 pr-5"
            on:click={showNextItem}><ArrowUturnDownIcon class="h-4 w-4" /></button
        >
        <Markdown md={checklistItems[currentIndex]} />
    </div>
{:else}
    <span class="italic">No items in list!</span>
{/if}
