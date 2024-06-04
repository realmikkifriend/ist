<script>
    import { createEventDispatcher, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { createTomorrowDateWithTime } from "../../js/time";
    export let task;

    const dispatch = createEventDispatcher();

    const handleDefer = (rawTime) => {
        dispatch("defer", { rawTime });
    };

    let extractedTime, tomorrowInMS;

    const updateMilliseconds = () => {
        const result = createTomorrowDateWithTime(task.due.string),
            tomorrow = result.tomorrow,
            now = DateTime.now();
        extractedTime = result.extractedTime;
        tomorrowInMS = tomorrow.diff(now).milliseconds;
    };

    updateMilliseconds();

    const interval = setInterval(updateMilliseconds, 60000);

    onDestroy(() => {
        clearInterval(interval);
    });

    const buttonConfigs = [
        {
            text: `tomorrow ${extractedTime}`,
            time: tomorrowInMS,
            basis: "basis-full",
            height: "h-8",
        },
        { text: "1 minute", time: 60 * 1000, basis: "basis-[48.5%]", height: "h-5" },
        { text: "3 minutes", time: 3 * 60 * 1000, basis: "basis-[48.5%]", height: "h-5" },
        { text: "10 minutes", time: 10 * 60 * 1000, basis: "basis-[48.5%]", height: "h-6" },
        { text: "15 minutes", time: 15 * 60 * 1000, basis: "basis-[48.5%]", height: "h-6" },
        { text: "30 minutes", time: 30 * 60 * 1000, basis: "basis-[48.5%]", height: "h-7" },
        { text: "45 minutes", time: 45 * 60 * 1000, basis: "basis-[48.5%]", height: "h-7" },
        { text: "1 hour", time: 60 * 60 * 1000, basis: "basis-[48.5%]", height: "h-8" },
        { text: "90 minutes", time: 90 * 60 * 1000, basis: "basis-[48.5%]", height: "h-8" },
        { text: "2 hrs", time: 2 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "3 hrs", time: 3 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "4 hrs", time: 4 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "6 hrs", time: 6 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "8 hrs", time: 8 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "12 hrs", time: 12 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "18 hrs", time: 18 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
        { text: "24 hrs", time: 24 * 60 * 60 * 1000, basis: "basis-[22.75%]", height: "h-8" },
    ];
</script>

<div class="mt-4 flex w-72 flex-row flex-wrap gap-2">
    {#each buttonConfigs as { text, time, basis, height }}
        <button
            class="btn mb-2 min-h-4 bg-neutral px-1 hover:bg-secondary {basis} {height}"
            on:click={() => handleDefer(time)}
            >{text}
        </button>
    {/each}
</div>
