<script lang="ts">
    import { writable } from "svelte/store";
    import { Icon, Backspace } from "svelte-hero-icons";
    import Markdown from "svelte-exmarkdown";
    import { generateDynalistComment } from "./dynalist";
    import { updateDynalist } from "./dynalistApi";
    import { success } from "../../../services/toastService";
    import type { Writable } from "svelte/store";
    import type { DynalistContent, DynalistNode } from "../../../../types/dynalist";

    export let content: DynalistContent;

    const removedItemIds: Writable<Set<string>> = writable(new Set());

    $: checklistItems =
        (content?.children as DynalistNode[])?.filter((item) => !$removedItemIds.has(item.id)) ||
        [];

    /**
     * Creates a handler function to cross off the next checklist item when the button is clicked.
     * Adds animation, updates Dynalist via API, and updates the removed items store.
     * @param buttonElement - The button DOM element to animate.
     * @returns An async function to handle the click event.
     */
    const createShowNextItemHandler =
        (buttonElement: HTMLButtonElement) => async (): Promise<void> => {
            if (checklistItems.length === 0) return;

            buttonElement.classList.add("animate-ping");

            const itemToRemove = checklistItems[0];

            const changes = [
                {
                    action: "edit",
                    node_id: itemToRemove.id,
                    checked: true,
                },
            ];

            await updateDynalist(content.file_id, changes)
                .then(() => {
                    removedItemIds.update((ids) => new Set([...ids, itemToRemove.id]));
                    success("Removed from list in Dynalist!");
                })
                .catch((error: unknown) => {
                    console.error("Failed to update Dynalist:", error);
                })
                .finally(() => {
                    buttonElement.classList.remove("animate-ping");
                });
        };

    /**
     * Svelte action to attach the cross-off handler to a button element.
     * Cleans up the event listener when the element is destroyed.
     * @param node - The button DOM element.
     * @returns An object with a destroy method for cleanup.
     */
    const buttonAction = (node: HTMLButtonElement) => {
        const handleClick = createShowNextItemHandler(node);
        // Wrap the async handler to avoid returning a Promise to the event system
        const syncHandler = () => {
            void handleClick();
        };
        node.addEventListener("click", syncHandler);

        return {
            destroy() {
                node.removeEventListener("click", syncHandler);
            },
        };
    };
</script>

{#if checklistItems.length > 0}
    <div class="mt-2">
        <em class="absolute -top-3.5 left-0 text-xs text-nowrap opacity-25">
            <span>{checklistItems.length} remaining</span>
        </em>
        <button
            use:buttonAction
            class="bg-primary float-left mt-0.5 mr-2 inline-block h-5 w-5 cursor-pointer rounded-sm p-1 pr-5 pb-5"
            ><Icon src={Backspace} class="h-4 w-4" /></button
        >
        {#key checklistItems}
            <Markdown
                md={`${checklistItems[0].content}\n${generateDynalistComment(checklistItems[0])}`}
            />
        {/key}
    </div>
{:else}
    <span class="italic">No tasks in list!</span>
{/if}
