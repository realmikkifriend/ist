<script>
    import { writable } from "svelte/store";
    import { parseCountData, handleCount, calculateLabel } from "./dynalistCount.js";

    export let content;

    const todayFormatted = new Date().toLocaleDateString("en-CA");
    const options = ["+1", "+5", "+10"];

    const initialData = parseCountData(content.note);
    const countData = writable(
        initialData.date !== todayFormatted
            ? { ...initialData, date: todayFormatted, current: 0 }
            : initialData,
    );

    async function handleCountClick(option) {
        const updatedData = await handleCount(option, $countData, content);
        countData.set(updatedData);
    }

    $: labelInfo = calculateLabel($countData);
</script>

<span class="flex w-full flex-col justify-between">
    <span class="flex w-full items-center text-xl">
        {content.content}
        <span
            class="badge badge-xs ml-1 w-fit overflow-hidden whitespace-nowrap p-2 px-3 pt-[0.45rem] text-[0.6rem] font-bold uppercase {labelInfo.classes}"
        >
            {labelInfo.label}
        </span>
    </span>

    <span class="flex w-full items-end justify-between">
        <span class="flex flex-nowrap items-baseline">
            <span class="text-2xl {$countData.current >= $countData.total ? 'text-blue-500' : ''}"
                >{$countData.current}</span
            >
            <span class="ml-2 mr-3 text-base text-secondary">
                <span class="text-lg">&#8725;</span>{$countData.total}
            </span>
            <small class={$countData.current >= $countData.total ? "text-blue-500" : ""}>
                {`${Math.round(($countData.current / $countData.total) * 100)}%`}
            </small>
        </span>
        <span class="flex flex-nowrap items-end">
            {#each options as option, index (index)}
                <button
                    class="btn ml-1 h-8 min-h-8 px-1 pb-1 pt-0 text-primary-content hover:bg-base-100 active:bg-primary {$countData.current >=
                    $countData.total
                        ? 'bg-neutral'
                        : 'bg-primary'}"
                    on:click={() => handleCountClick(option)}
                >
                    {option}
                </button>
            {/each}
        </span>
    </span>
</span>
