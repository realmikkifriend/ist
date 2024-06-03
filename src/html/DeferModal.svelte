<script>
    import { createEventDispatcher } from "svelte";
    import { CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    export let task;

    const dispatch = createEventDispatcher();
    let isTimeTabActive = true;

    const handleDefer = (ms) => {
        dispatch("defer", { task, ms });
    };

    const selectTab = (tab) => {
        isTimeTabActive = tab === "time";
    };
</script>

<div class="modal-box min-h-[75%]">
    {#if task.due.all_day == 1}
        add date picker here
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
            <div class="modal-action">
                <button class="btn" on:click={() => handleDefer(24 * 60 * 60 * 1000)}>1 Day</button>
            </div>
        {:else}
            <div class="modal-action">add calendar defer menu here</div>
        {/if}
    {/if}
</div>
<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
