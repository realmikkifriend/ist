<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { BackwardIcon } from "@krowten/svelte-heroicons";
    export let content;

    let checklistItems,
        buttonElement,
        currentIndex = 0;

    onMount(() => {
        checklistItems = parseContent(content);
    });

    function parseContent(content) {
        return content.split("\n").reduce((result, line) => {
            if (line.startsWith("  - ") && result.length > 0) {
                result[result.length - 1] += "\n" + line;
            } else {
                result.push(line.substring(2).trim());
            }
            return result;
        }, []);
    }

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
