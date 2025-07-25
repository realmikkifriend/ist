<script lang="ts">
    import { writable } from "svelte/store";
    import { Icon, ArrowUturnDown } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import Markdown from "svelte-exmarkdown";
    import { generateDynalistComment } from "./dynalist";
    import { updateDynalist } from "./dynalistApi";
    import { success } from "../../../js/toasts";
    import type { Writable } from "svelte/store";
    import type { DynalistContent, DynalistNode, DynalistChange } from "../../../../types/dynalist";

    export let content: DynalistContent;

    const rotationIndex: Writable<number> = writable(0);
    const isLoading: Writable<boolean> = writable(false);

    $: checklistItems = (content?.children as DynalistNode[]) || [];
    $: rotatedItems = rotateArray(checklistItems, $rotationIndex);
    $: currentItem = rotatedItems[0];
    $: hasItems = checklistItems.length > 0;

    /**
     * Rotates an array by the given index.
     * @param arr - The array to rotate.
     * @param index - The index to rotate by.
     * @returns The rotated array.
     */
    function rotateArray<T>(arr: T[], index: number): T[] {
        if (!arr || arr.length === 0) return [];
        const normalizedIndex = index % arr.length;
        return [...arr.slice(normalizedIndex), ...arr.slice(0, normalizedIndex)];
    }

    /**
     * Checks if a date string is in "Month Year" format.
     * @param dateString - The date string to check.
     * @returns True if the string is in "Month Year" format, false otherwise.
     */
    function isMonthYearFormat(dateString?: string): boolean {
        const trimmed = dateString?.trim() || "";
        const fullMonthFormat = DateTime.fromFormat(trimmed, "LLLL yyyy");
        const shortMonthFormat = DateTime.fromFormat(trimmed, "LLL yyyy");
        return fullMonthFormat.isValid || shortMonthFormat.isValid;
    }

    /**
     * Creates an array of changes for updating a Dynalist item.
     * @param item - The Dynalist node to update.
     * @returns An array of changes.
     */
    function createUpdateChanges(item: DynalistNode): DynalistChange[] {
        const changes: DynalistChange[] = [
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
    }

    /**
     * Handles a successful update to Dynalist.
     * @returns True if the update was successful.
     */
    function handleUpdateSuccess(): boolean {
        success("Sent to bottom of list in Dynalist!");
        isLoading.set(false);
        return true;
    }

    /**
     * Handles an error during update to Dynalist.
     * @param error - The error object.
     * @returns False to indicate failure.
     */
    function handleUpdateError(error: unknown): boolean {
        console.error("Failed to update Dynalist:", error);
        isLoading.set(false);
        return false;
    }

    /**
     * Rotates to the next item in the checklist and updates Dynalist.
     * @returns A promise resolving to true if successful, false otherwise.
     */
    async function showNextItem(): Promise<boolean> {
        if (!currentItem || $isLoading) return false;

        isLoading.set(true);
        rotationIndex.update((index) => (index + 1) % checklistItems.length);

        const changes = createUpdateChanges(currentItem);

        return updateDynalist(content.file_id, changes).then(
            handleUpdateSuccess,
            handleUpdateError,
        );
    }
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
            <Icon src={ArrowUturnDown} class="h-4 w-4" />
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
