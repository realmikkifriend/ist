<script lang="ts">
    import Markdown from "svelte-exmarkdown";
    import { Icon, Backward } from "svelte-hero-icons";
    import { writable } from "svelte/store";
    import { hasError } from "./dynalist";
    import type { DynalistContent, DynalistNode } from "../../../types/dynalist";

    export let content: DynalistContent | undefined;

    const currentIndex = writable(0);

    $: checklistItems =
        content && Array.isArray(content?.children) ? (content.children as DynalistNode[]) : [];

    $: errorMessage = !content
        ? "No checklist content provided."
        : hasError(content)
          ? content.error?.message || "Failed to load Dynalist checklist."
          : checklistItems.length === 0
            ? "No checklist items found."
            : null;

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
            if ($currentIndex < checklistItems.length - 1) {
                currentIndex.update((n) => n + 1);
                buttonElement.parentElement?.classList.remove("line-through", "text-secondary");
                buttonElement.classList.remove("bg-secondary", "border-secondary");
            }
        }, 200);
    }
</script>

{#if errorMessage}
    <div class="text-error italic">{errorMessage}</div>
{:else if checklistItems && $currentIndex < checklistItems.length}
    <div class="mt-2">
        <em class="absolute -top-3.5 -left-0.5 text-xs text-nowrap opacity-25">
            <span class="mr-0.5 inline-block w-7">{$currentIndex + 1}/{checklistItems.length}</span>
        </em>
        <button
            class="border-primary-content float-left mt-1 mr-2 inline-block h-5 w-5 cursor-pointer border-2 transition-colors"
            on:click={showNextItem}
        />
        <Markdown md={checklistItems[$currentIndex]?.content ?? ""} />
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
            on:click={() => currentIndex.set(0)}
        >
            <Icon src={Backward} class="h-5 w-5" />
        </button>
    </div>
{/if}
