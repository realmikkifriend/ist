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
    <div>
        <button
            bind:this={buttonElement}
            class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer border-2 border-secondary transition-colors"
            on:click={showNextItem}
        />
        <Markdown md={checklistItems[currentIndex]} />
    </div>
{:else}
    <span class="italic">Reached end of list.</span>
{/if}

{#if currentIndex > 0}
    <div class="absolute right-11 top-[-0.5rem]">
        <button
            class="btn m-0 h-2 min-h-8 gap-0 border-transparent p-1 pb-2 pt-1.5 hover:bg-primary hover:text-white"
            class:bg-transparent={currentIndex < checklistItems.length - 1}
            class:bg-primary={currentIndex === checklistItems.length - 1}
            on:click={() => (currentIndex = 0)}
        >
            <BackwardIcon class="h-5 w-5" />
        </button>
    </div>
{/if}
