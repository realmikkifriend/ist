<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { Icon, Backward } from "svelte-hero-icons";
    import { hasError } from "../../../../utils/dynalistUtils";
    import { parseList } from "../../../../utils/dynalistProcessUtils";

    let { content }: { content: string } = $props();

    let currentIndex = $state(0);

    let checklistItems = $derived(
        (() => {
            if (!content || hasError(content)) {
                return [];
            }
            const result = parseList(typeof content === "string" ? content : "");
            return result instanceof Error ? [] : result;
        })(),
    );

    let errorMessage = $derived(
        !content
            ? "No checklist content provided."
            : hasError(content)
              ? content.error?.message || "Failed to load Dynalist checklist."
              : checklistItems.length === 0
                ? "No checklist items found."
                : null,
    );

    /**
     * Handles the click event to show the next checklist item.
     * Adds visual feedback, then advances the current index after a delay.
     * @param event - The click event from the button
     */
    function showNextItem(event: MouseEvent) {
        const buttonElement = event.currentTarget as HTMLElement;
        buttonElement.parentElement?.classList.add("line-through", "text-secondary");
        buttonElement.classList.add("bg-secondary", "border-secondary");

        setTimeout(() => {
            currentIndex++;
            buttonElement.parentElement?.classList.remove("line-through", "text-secondary");
            buttonElement.classList.remove("bg-secondary", "border-secondary");
        }, 200);
    }
</script>

{#if errorMessage}
    <div class="text-error italic">{errorMessage}</div>
{:else if checklistItems && currentIndex < checklistItems.length - 1}
    <div class="mt-1">
        <div class="absolute -top-3.5 left-0 flex w-full items-center">
            <progress
                class="progress h-1 w-3/4 opacity-25 sm:w-4/5"
                max={checklistItems.length - 1}
                value={currentIndex}
            ></progress>
            <span class="text-tiny mr-0.5 ml-2 inline-block w-7"
                >{currentIndex}/{checklistItems.length - 1}</span
            >
        </div>
        <button
            class="comment-focus border-primary-content relative float-left mt-1 mr-2 inline-block h-5 w-5 cursor-pointer border-2 transition-colors"
            aria-label="Next item"
            onclick={showNextItem}
            type="button"><kbd>z, Enter</kbd></button
        >
        <SvelteMarkdown source={checklistItems[currentIndex] ?? ""} />
    </div>
{:else}
    <progress
        class="progress progress-success absolute -top-1 left-0 h-1 w-9/10 opacity-25"
        max="1"
        value="1"
    ></progress>
    <span class="italic">End of list!</span>
{/if}

{#if currentIndex > 0}
    <div class="absolute top-6 -right-7">
        <button
            class="btn text-primary-content hover:bg-primary m-0 h-2 min-h-8 gap-0 border-transparent p-1 pt-1 pb-2.5 shadow-none hover:text-white"
            class:bg-accent={currentIndex < checklistItems.length - 1}
            class:bg-primary={currentIndex === checklistItems.length - 1}
            aria-label="Reset checklist"
            onclick={() => (currentIndex = 0)}
            type="reset"
        >
            <Icon class="h-5 w-5" src={Backward} />
        </button>
    </div>
{/if}
