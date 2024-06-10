<script>
    import { createEventDispatcher, onDestroy, onMount, afterUpdate } from "svelte";
    import { DateTime } from "luxon";
    import { createTomorrowDateWithTime } from "../../js/time";
    import buttons from "../../js/deferButtons";

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

        buttons[0].text = `tomorrow ${extractedTime}`;
        buttons[0].ms = tomorrowInMS;

        for (let i = 1; i < buttons.length; i++) {
            let futureTime = now.plus({ milliseconds: buttons[i].ms });
            buttons[i].time = futureTime.toFormat("h:mm a");
        }
    };

    onMount(() => {
        updateMilliseconds();
    });

    afterUpdate(() => {
        updateMilliseconds();
    });

    const interval = setInterval(updateMilliseconds, 30000);

    onDestroy(() => {
        clearInterval(interval);
    });
</script>

<div class="mt-4 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each buttons as { text, ms, basis, height, time }}
        <div class={basis}>
            <button
                class="btn min-h-4 w-full rounded-md bg-neutral px-1 hover:bg-secondary {height}"
                on:click={() => handleDefer(ms)}
                >{text}
            </button>
            {#if time}
                <span class="block text-left text-xs opacity-50">{time}</span>
            {/if}
        </div>
    {/each}
</div>
