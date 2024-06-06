<script>
    import { createEventDispatcher, onDestroy, onMount, afterUpdate } from "svelte";
    import { DateTime } from "luxon";
    import { createTomorrowDateWithTime } from "../../js/time";
    import buttonConfigs from "../../js/deferButtons";

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

        buttonConfigs[0].text = `tomorrow ${extractedTime}`;
        buttonConfigs[0].time = tomorrowInMS;
    };

    onMount(() => {
        updateMilliseconds();
    });

    afterUpdate(() => {
        updateMilliseconds();
    });

    const interval = setInterval(updateMilliseconds, 60000);

    onDestroy(() => {
        clearInterval(interval);
    });
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
