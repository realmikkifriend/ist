<script lang="ts">
    import { Icon, ArrowUturnDown, Backward } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { isMonthYearFormat, parseRotatingDate } from "../../../../utils/timeUtils";
    import { generateDynalistComment } from "../../../../utils/dynalistProcessUtils";
    import { updateDynalistWithToken } from "../../../../services/dynalistService";
    import { success } from "../../../../services/toastService";
    import type {
        DynalistNode,
        DynalistChange,
        DynalistViewProps,
    } from "../../../../types/dynalist";

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
     * @param moveDirection - The direction of the move ('next' or 'previous').
     * @returns An array of changes.
     */
    function createUpdateChanges(
        item: DynalistNode,
        moveDirection: "next" | "previous" = "next",
    ): DynalistChange[] {
        const changes: DynalistChange[] = [
            {
                action: "move",
                node_id: item.id,
                parent_id: content!.id,
                index: moveDirection === "next" ? -1 : 0, // -1 for bottom, 0 for top
            },
        ];

        if ((!item.note || isMonthYearFormat(item.note)) && moveDirection === "next") {
            const today = DateTime.now();
            const newMonthYear = today.toFormat("MMM d yyyy");
            changes.push({
                action: "edit",
                node_id: item.id,
                note: newMonthYear,
            });
        }

        return changes;
    }

    /**
     * Rotates to the next or previous item in the checklist and updates Dynalist.
     * @param direction - The direction to rotate ('next' or 'previous').
     * @returns A promise resolving to true if successful, false otherwise.
     */
    async function rotateItem(direction: "next" | "previous"): Promise<boolean> {
        if (!currentItem || isLoading || !content) return false;

        isLoading = true;

        let changes: DynalistChange[];
        let newRotationIndex: number;

        if (direction === "next") {
            changes = createUpdateChanges(currentItem, "next");
            newRotationIndex = (rotationIndex + 1) % checklistItems.length;
        } else {
            changes = createUpdateChanges(checklistItems[checklistItems.length - 1], "previous");
            newRotationIndex = (rotationIndex - 1 + checklistItems.length) % checklistItems.length;
        }

        rotationIndex = newRotationIndex;

        return updateDynalistWithToken(content.file_id, changes).then(
            () => {
                success("Updated list saved to Dynalist!");
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
    let displayNote = $derived(() => {
        if (!currentItem?.note) return "";
        const parsed = parseRotatingDate(currentItem.note);
        return parsed ? parsed.toFormat("MMM d yyyy") : currentItem.note;
    });
</script>

{#if hasItems}
    <div class="mt-1 w-23/24">
        <div
            class="outline-primary/50 float-left mt-1.5 mr-2 flex flex-col gap-0.5 rounded-sm p-0.5 outline-1"
        >
            <button
                class="btn bg-secondary relative inline-block h-5 w-6 rounded-sm pt-0.25 pr-5 pb-4 pl-1"
                aria-label="Rewind checklist"
                onclick={() => rotateItem("previous")}
                type="reset"
            >
                <Icon class="h-4 w-4 object-fill" src={Backward} />
            </button>
            <button
                class="comment-focus bg-primary relative inline-block h-5 w-6 cursor-pointer rounded-sm pt-1 pr-5 pb-5 pl-1"
                class:animate-ping={isLoading}
                disabled={isLoading}
                onclick={() => rotateItem("next")}
                type="button"
            >
                <Icon class="h-4 w-4 object-fill" src={ArrowUturnDown} />
                <kbd>z, Enter</kbd>
            </button>
        </div>

        {#key rotationIndex}
            <em class="absolute -top-3.5 left-0 text-xs text-nowrap opacity-25">
                <span class="mr-0.5 inline-block w-7">&infin;{checklistItems.length}</span>
                {#if currentItem?.note && isMonthYearFormat(currentItem.note)}
                    <span>last completed {displayNote()}</span>
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
