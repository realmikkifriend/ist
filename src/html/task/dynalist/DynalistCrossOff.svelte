<script>
    import { writable } from "svelte/store";
    import { BackspaceIcon } from "@krowten/svelte-heroicons";
    import Markdown from "svelte-exmarkdown";
    import { generateDynalistComment } from "./dynalist";
    import { updateDynalist } from "./dynalistApi";
    import { success } from "../../../js/toasts";

    export let content;

    const removedItemIds = writable(new Set());

    $: checklistItems = content?.children?.filter((item) => !$removedItemIds.has(item.id)) || [];

    const createShowNextItemHandler = (buttonElement) => async () => {
        if (checklistItems.length === 0) return;

        buttonElement.classList.add("animate-ping");

        const itemToRemove = checklistItems[0];

        try {
            const changes = [
                {
                    action: "edit",
                    node_id: itemToRemove.id,
                    checked: true,
                },
            ];

            await updateDynalist(content.file_id, changes);

            removedItemIds.update((ids) => new Set([...ids, itemToRemove.id]));
            success("Removed from list in Dynalist!");
            buttonElement.classList.remove("animate-ping");
        } catch (error) {
            console.error("Failed to update Dynalist:", error);
            buttonElement.classList.remove("animate-ping");
        }
    };

    const buttonAction = (node) => {
        const handleClick = createShowNextItemHandler(node);
        node.addEventListener("click", handleClick);

        return {
            destroy() {
                node.removeEventListener("click", handleClick);
            },
        };
    };
</script>

{#if checklistItems.length > 0}
    <div class="mt-2">
        <em class="absolute -top-3.5 left-0 text-nowrap text-xs opacity-25">
            <span>{checklistItems.length} remaining</span>
        </em>
        <button
            use:buttonAction
            class="float-left mr-2 mt-0.5 inline-block h-5 w-5 cursor-pointer rounded bg-primary p-1 pb-5 pr-5"
            ><BackspaceIcon class="h-4 w-4" /></button
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
