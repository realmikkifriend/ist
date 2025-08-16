<script lang="ts">
    import { Icon, ArrowUturnDown } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { isMonthYearFormat } from "../../../utils/timeUtils";
    import { generateDynalistComment } from "../../../utils/dynalistProcessUtils";
    import { updateDynalistWithToken } from "../../../services/dynalistService";
    import { success } from "../../../services/toastService";
    import type { DynalistNode, DynalistChange, DynalistViewProps } from "../../../types/dynalist";

    let { dynalistObject: content }: DynalistViewProps = $props();

    let rotationIndex = $state(0);
    let isLoading = $state(false);

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
     * Creates an array of changes for updating a Dynalist item.
     * @param item - The Dynalist node to update.
     * @returns An array of changes.
     */
    function createUpdateChanges(item: DynalistNode): DynalistChange[] {
        const changes: DynalistChange[] = [
            {
                action: "move",
                node_id: item.id,
                parent_id: content!.id,
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
     * Rotates to the next item in the checklist and updates Dynalist.
     * @returns A promise resolving to true if successful, false otherwise.
     */
    async function showNextItem(): Promise<boolean> {
        if (!currentItem || isLoading || !content) return false;

        isLoading = true;
        rotationIndex = (rotationIndex + 1) % checklistItems.length;

        const changes = createUpdateChanges(currentItem);

        return updateDynalistWithToken(content.file_id, changes).then(
            () => {
                success("Sent to bottom of list in Dynalist!");
                isLoading = false;
                return true;
            },
            (error: unknown) => {
                console.error("Failed to update Dynalist:", error);
                isLoading = false;
                return false;
            },
        );
    }
    let checklistItems = $derived((content?.children as DynalistNode[]) || []);
    let rotatedItems = $derived(rotateArray(checklistItems, rotationIndex));
    let currentItem = $derived(rotatedItems[0]);
    let hasItems = $derived(checklistItems.length > 0);
</script>

{#if hasItems}
    <div class="mt-2">
        <button
            class="comment-focus bg-primary relative float-left mt-0.5 mr-2 inline-block h-5 w-5 cursor-pointer rounded-sm p-1 pr-5 pb-5"
            class:animate-ping={isLoading}
            disabled={isLoading}
            onclick={showNextItem}
            type="button"
        >
            <Icon class="h-4 w-4" src={ArrowUturnDown} />
            <kbd>z, Enter</kbd>
        </button>

        {#key rotationIndex}
            <em class="absolute -top-3.5 left-0 text-xs text-nowrap opacity-25">
                <span class="mr-0.5 inline-block w-7">&infin;{checklistItems.length}</span>
                {#if currentItem?.note && isMonthYearFormat(currentItem.note)}
                    <span>last completed {currentItem.note}</span>
                {/if}
            </em>
            <SvelteMarkdown
                source={`${currentItem?.content || ""}\n${generateDynalistComment(currentItem)}`}
            />
        {/key}
    </div>
{:else}
    <span class="italic">No tasks in list!</span>
{/if}
