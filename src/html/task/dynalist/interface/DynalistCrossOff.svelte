<script lang="ts">
    import { on } from "svelte/events";
    import { Icon, Backspace } from "svelte-hero-icons";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { generateDynalistComment } from "../../../../utils/dynalistProcessUtils";
    import { updateDynalistWithToken } from "../../../../services/dynalistService";
    import { success } from "../../../../services/toastService";
    import type { DynalistNode, DynalistViewProps } from "../../../../types/dynalist";

    let { dynalistObject }: DynalistViewProps = $props();

    let removedItemIds = $state(new Set<string>());

    let checklistItems = $derived(
        (dynalistObject?.children as DynalistNode[])?.filter(
            (item) => !removedItemIds.has(item.id),
        ) || [],
    );

    /**
     * Creates a handler function to cross off the next checklist item when the button is clicked.
     * Adds animation, updates Dynalist via API, and updates the removed items store.
     * @param buttonElement - The button DOM element to animate.
     * @returns An async function to handle the click event.
     */
    const createShowNextItemHandler =
        (buttonElement: HTMLButtonElement) => async (): Promise<void> => {
            if (checklistItems.length === 0) return;
            if (!dynalistObject) {
                console.error("Dynalist object is undefined.");
                return;
            }

            buttonElement.classList.add("animate-ping");

            const itemToRemove = checklistItems[0];

            const changes = [
                {
                    action: "edit",
                    node_id: itemToRemove.id,
                    checked: true,
                },
            ];

            await updateDynalistWithToken(dynalistObject.file_id, changes)
                .then(() => {
                    removedItemIds = new Set([...removedItemIds, itemToRemove.id]);
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

        const syncHandler = () => {
            void handleClick();
        };
        on(node, "click", syncHandler);

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
            class="comment-focus bg-primary relative float-left mt-0.5 mr-2 inline-block h-5 w-5 cursor-pointer rounded-sm p-1 pr-5 pb-5"
            type="button"
            use:buttonAction
            ><Icon class="h-4 w-4" src={Backspace} />
            <kbd>z, Enter</kbd></button
        >
        {#key checklistItems}
            <SvelteMarkdown
                source={`${checklistItems[0].content}\n${generateDynalistComment(checklistItems[0])}`}
            />
        {/key}
    </div>
{:else}
    <span class="italic">No tasks in list!</span>
{/if}
