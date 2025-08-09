<script lang="ts">
    import { handleCount } from "../../../services/dynalistService";
    import { parseCountData, calculateLabel } from "../../../utils/dynalistUtils";
    import type { DynalistCountData, LabelInfo, DynalistViewProps } from "../../../types/dynalist";

    let { dynalistObject: content }: DynalistViewProps = $props();

    const todayFormatted: string = new Date().toLocaleDateString("en-CA");
    const options: string[] = ["+1", "+5", "+10"];

    const noteContent: string = typeof content?.note === "string" ? content.note : "";
    const initialData: DynalistCountData = parseCountData(noteContent);

    let countData: DynalistCountData = $state(
        initialData.date !== todayFormatted
            ? { ...initialData, date: todayFormatted, current: 0 }
            : initialData,
    );

    /**
     * Handles a click on a count option button.
     * Updates the count data store with the new value.
     * @param option - The increment option selected (e.g., "+1", "+5", "+10")
     */
    async function handleCountClick(option: string): Promise<void> {
        if (!content) return;
        const updatedData: DynalistCountData = await handleCount(option, countData, content);
        countData = updatedData;
    }

    let labelInfo = $derived(calculateLabel(countData) as LabelInfo);
</script>

<span class="flex w-full flex-col justify-between">
    <span class="flex w-full items-center text-xl">
        {content?.content}
        <span
            class="badge badge-xs ml-1 w-fit overflow-hidden p-2 px-3 pt-[0.45rem] text-[0.6rem] font-bold whitespace-nowrap uppercase {labelInfo.classes}"
        >
            {labelInfo.label}
        </span>
    </span>

    <span class="flex w-full items-end justify-between">
        <span class="flex flex-nowrap items-baseline">
            <span class="text-2xl" class:text-blue-500={countData.current >= countData.total}
                >{countData.current}</span
            >
            <span class="text-secondary mr-3 ml-2 text-base">
                <span class="text-lg">&#8725;</span>{countData.total}
            </span>
            <small class:text-blue-500={countData.current >= countData.total}>
                {`${Math.round((countData.current / countData.total) * 100)}%`}
            </small>
        </span>
        <span class="flex flex-nowrap items-end">
            {#each options as option, index (index)}
                <button
                    class="btn text-primary-content hover:bg-base-100 active:bg-primary ml-1 h-8 min-h-8 px-1 pt-0 pb-1 {countData.current >=
                    countData.total
                        ? 'bg-neutral'
                        : 'bg-primary'}"
                    onclick={() => handleCountClick(option)}
                    type="button"
                >
                    {option}
                </button>
            {/each}
        </span>
    </span>
</span>
