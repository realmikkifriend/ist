<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { Icon, Backward } from "svelte-hero-icons";
    import { writable } from "svelte/store";
    import { parseList, hasError } from "../../../utils/dynalistUtils";

    let { content }: { content: string } = $props();

    const currentIndex = writable(0);

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
            currentIndex.update((n) => n + 1);
            buttonElement.parentElement?.classList.remove("line-through", "text-secondary");
            buttonElement.classList.remove("bg-secondary", "border-secondary");
        }, 200);
    }
</script>

{#if errorMessage}
    <div class="text-error italic">{errorMessage}</div>
{:else if checklistItems && $currentIndex < checklistItems.length - 1}
    <div class="mt-1">
        <em class="absolute -top-2 -left-0.5 text-xs text-nowrap opacity-25">
            <span class="mr-0.5 inline-block w-7"
                >{$currentIndex + 1}/{checklistItems.length - 1}</span
            >
        </em>
        <button
            class="border-primary-content float-left mt-1 mr-2 inline-block h-5 w-5 cursor-pointer border-2 transition-colors"
            onclick={showNextItem}
            aria-label="Next item"
        ></button>
        <SvelteMarkdown source={checklistItems[$currentIndex] ?? ""} />
    </div>
{:else}
    <span class="italic">End of list!</span>
{/if}

{#if $currentIndex > 0}
    <div class="absolute top-6 -right-7">
        <button
            class="btn text-primary-content hover:bg-primary m-0 h-2 min-h-8 gap-0 border-transparent p-1 pt-1 pb-2.5 shadow-none hover:text-white"
            class:bg-accent={$currentIndex < checklistItems.length - 1}
            class:bg-primary={$currentIndex === checklistItems.length - 1}
            onclick={() => currentIndex.set(0)}
            aria-label="Reset checklist"
        >
            <Icon src={Backward} class="h-5 w-5" />
        </button>
    </div>
{/if}
