<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import { ArrowUturnDownIcon } from "@krowten/svelte-heroicons";
    import { generateDynalistComment, updateDynalist } from "./dynalist";
    import { success } from "../../../js/toasts";

    export let content;

    let checklistItems, buttonElement;

    onMount(() => {
        checklistItems = content.children;
    });

    async function showNextItem() {
        buttonElement.classList.add("animate-ping");

        const itemToMove = checklistItems.splice(0, 1)[0];
        checklistItems = [...checklistItems, itemToMove];

        try {
            const changes = [
                {
                    action: "move",
                    node_id: itemToMove.id,
                    parent_id: content.id,
                    index: -1,
                },
            ];

            await updateDynalist(content.file_id, changes);

            success("Sent to bottom of list in Dynalist!");
            buttonElement.classList.remove("animate-ping");
        } catch (error) {
            console.error("Failed to update Dynalist:", error);
        }
    }
</script>

{#if checklistItems?.length > 0}
    <div class="text-primary-content">
        <button
            bind:this={buttonElement}
            class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer rounded bg-primary p-1 pb-5 pr-5"
            on:click={showNextItem}><ArrowUturnDownIcon class="h-4 w-4" /></button
        >
        {#key checklistItems}
            <Markdown
                md={`${checklistItems[0].content}\n${generateDynalistComment(checklistItems[0])}`}
            />
        {/key}
    </div>
{:else}
    <span class="italic">No items in list!</span>
{/if}
