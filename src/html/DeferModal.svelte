<script>
    import { createEventDispatcher } from "svelte";
    import { CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    import DatePicker from "./DatePicker.svelte";
    export let task;

    const dispatch = createEventDispatcher();

    let isTimeTabActive = true;

    const selectTab = (tab) => {
        isTimeTabActive = tab === "time";
    };

    const handleDefer = ({ detail: { time } }) => {
        dispatch("defer", { task, time });
    };
</script>

<div class="modal-box min-h-[55%] w-fit">
    {#if task.due.all_day == 1}
        <DatePicker on:defer={handleDefer} />
    {:else}
        <div class="flex justify-center">
            <div role="tablist" class="tabs-boxed tabs w-1/2 bg-neutral">
                <button
                    role="tab"
                    tabindex="0"
                    class={isTimeTabActive ? "tab tab-active" : "tab bg-neutral"}
                    on:click={() => selectTab("time")}
                >
                    <ClockIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                </button>
                <button
                    role="tab"
                    tabindex="0"
                    class={!isTimeTabActive ? "tab tab-active" : "tab bg-neutral"}
                    on:click={() => selectTab("calendar")}
                >
                    <CalendarIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                </button>
            </div>
        </div>
        {#if isTimeTabActive}
            <div class="min-w-72">
                <button class="btn" on:click={() => handleDefer(24 * 60 * 60 * 1000)}>1 Day</button>
            </div>
        {:else}
            <DatePicker on:defer={handleDefer} />
        {/if}
    {/if}
</div>
<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
