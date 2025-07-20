<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { BackwardIcon } from "@krowten/svelte-heroicons";
    import { parseList } from "./dynalist";
    export let content;

    let checklistItems,
        currentIndex = 0,
        errorMessage = null;

    onMount(() => {
        if (!content) {
            errorMessage = "No checklist content provided.";
            return;
        }
        if (content.error) {
            errorMessage = content.error.message || "Failed to load Dynalist checklist.";
            return;
        }
        const result = parseList(content);
        if (result instanceof Error) {
            errorMessage = "Failed to parse checklist content.";
            checklistItems = [];
        } else {
            checklistItems = result;
        }
    });

    function showNextItem(event) {
        const buttonElement = event.currentTarget;
        buttonElement.parentElement.classList.add("line-through", "text-secondary");
        buttonElement.classList.add("bg-secondary", "border-secondary");

        setTimeout(() => {
            if (currentIndex < checklistItems.length - 1) {
                currentIndex++;
                buttonElement.parentElement.classList.remove("line-through", "text-secondary");
                buttonElement.classList.remove("bg-secondary", "border-secondary");
            }
        }, 200);
    }
</script>

{#if errorMessage}
    <div class="italic text-error">{errorMessage}</div>
{:else if checklistItems && currentIndex < checklistItems.length - 1}
    <div class="mt-2">
        <em class="absolute -left-0.5 -top-3.5 text-nowrap text-xs opacity-25">
            <span class="mr-0.5 inline-block w-7"
                >{currentIndex + 1}/{checklistItems.length - 1}</span
            >
        </em>
        <button
            class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer border-2 border-primary-content transition-colors"
            on:click={showNextItem}
        />
        <Markdown md={checklistItems[currentIndex]} />
    </div>
{:else}
    <span class="italic">End of list!</span>
{/if}

{#if currentIndex > 0}
    <div class="absolute -right-7 top-6">
        <button
            class="btn m-0 h-2 min-h-8 gap-0 border-transparent p-1 pb-2.5 pt-1 text-primary-content shadow-none hover:bg-primary hover:text-white"
            class:bg-accent={currentIndex < checklistItems.length - 1}
            class:bg-primary={currentIndex === checklistItems.length - 1}
            on:click={() => (currentIndex = 0)}
        >
            <BackwardIcon class="h-5 w-5" />
        </button>
    </div>
{/if}
