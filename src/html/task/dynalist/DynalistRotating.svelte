<script>
    import { writable } from "svelte/store";
    import { ArrowUturnDownIcon } from "@krowten/svelte-heroicons";
    import { DateTime } from "luxon";
    import Markdown from "svelte-exmarkdown";
    import { generateDynalistComment } from "./dynalist";
    import { updateDynalist } from "./dynalistApi";
    import { success } from "../../../js/toasts";

    export let content;

    const rotationIndex = writable(0);
    const isLoading = writable(false);

    $: checklistItems = content?.children || [];
    $: rotatedItems = rotateArray(checklistItems, $rotationIndex);
    $: currentItem = rotatedItems[0];
    $: hasItems = checklistItems.length > 0;

    const rotateArray = (arr, index) => {
        if (!arr || arr.length === 0) return [];
        const normalizedIndex = index % arr.length;
        return [...arr.slice(normalizedIndex), ...arr.slice(0, normalizedIndex)];
    };

    const isMonthYearFormat = (dateString) => {
        const trimmed = dateString?.trim() || "";
        const fullMonthFormat = DateTime.fromFormat(trimmed, "LLLL yyyy");
        const shortMonthFormat = DateTime.fromFormat(trimmed, "LLL yyyy");
        return fullMonthFormat.isValid || shortMonthFormat.isValid;
    };

    const createUpdateChanges = (item) => {
        const changes = [
            {
                action: "move",
                node_id: item.id,
                parent_id: content.id,
                index: -1,
            },
        ];

        if (!item.note || isMonthYearFormat(item.note)) {
            const today = DateTime.now();
            const newMonthYear = today.toFormat("LLLL yyyy");
            changes.push({
                action: "edit",
                node_id: item.id,
                note: newMonthYear,
            });
        }

        return changes;
    };

    const handleUpdateSuccess = () => {
        success("Sent to bottom of list in Dynalist!");
        isLoading.set(false);
        return true;
    };

    const handleUpdateError = (error) => {
        console.error("Failed to update Dynalist:", error);
        isLoading.set(false);
        return false;
    };

    const showNextItem = async () => {
        if (!currentItem || $isLoading) return false;

        isLoading.set(true);
        rotationIndex.update((index) => (index + 1) % checklistItems.length);

        const changes = createUpdateChanges(currentItem);

        return updateDynalist(content.file_id, changes).then(
            handleUpdateSuccess,
            handleUpdateError,
        );
    };
</script>

{#if hasItems}
    <div class="mt-2">
        <button
            class="float-left mr-2 mt-0.5 inline-block h-5 w-5 cursor-pointer rounded bg-primary p-1 pb-5 pr-5 {$isLoading
                ? 'animate-ping'
                : ''}"
            on:click={showNextItem}
            disabled={$isLoading}
        >
            <ArrowUturnDownIcon class="h-4 w-4" />
        </button>

        {#key $rotationIndex}
            <em class="absolute -top-3.5 left-0 text-nowrap text-xs opacity-25">
                <span class="mr-0.5 inline-block w-7">&infin;{checklistItems.length}</span>
                {#if currentItem?.note && isMonthYearFormat(currentItem.note)}
                    <span>last completed {currentItem.note}</span>
                {/if}
            </em>
            <Markdown
                md={`${currentItem?.content || ""}\n${generateDynalistComment(currentItem)}`}
            />
        {/key}
    </div>
{:else}
    <span class="italic">No tasks in list!</span>
{/if}
