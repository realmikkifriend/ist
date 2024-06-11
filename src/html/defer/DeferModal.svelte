<script>
    import { createEventDispatcher, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    import { DateTime } from "luxon";
    import { todoistResources } from "../../js/stores";
    import { createTomorrowDateWithTime } from "../../js/time";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    export let task;

    const dispatch = createEventDispatcher();

    let isTimeTabActive = true;

    const selectTab = (tab) => {
        isTimeTabActive = tab === "time";
    };

    const tz = get(todoistResources).user.tz_info.timezone;

    let items = [];

    const unsubscribe = todoistResources.subscribe((value) => {
        items = value.items;
    });

    onDestroy(() => {
        unsubscribe();
    });

    const handleDefer = ({ detail: { rawTime } }) => {
        let time;
        isTimeTabActive = true;

        if (typeof rawTime === "number") {
            const now = DateTime.now().setZone(tz);
            time = now.plus({ milliseconds: rawTime });
        } else if (typeof rawTime === "string") {
            const date = DateTime.fromISO(rawTime);

            if (task.due.all_day === 1) {
                time = date;
            } else {
                const extracted = createTomorrowDateWithTime(task.due.string, tz),
                    { hour, minute } = extracted.tomorrow;
                time = date.set({ hour, minute });
            }
        }

        dispatch("defer", { task, time });
    };
</script>

{#key items}
    <div class="modal-box min-h-[60%] w-fit">
        {#if task.due.all_day == 1}
            <DatePicker {task} {tz} {items} on:defer={handleDefer} />
        {:else}
            <div class="flex justify-center">
                <div role="tablist" class="tabs-boxed tabs w-2/3 bg-neutral">
                    {#each ["time", "calendar"] as tab}
                        <button
                            role="tab"
                            tabindex="0"
                            class={tab === (isTimeTabActive ? "time" : "calendar")
                                ? "tab tab-active"
                                : "tab bg-neutral"}
                            on:click={() => selectTab(tab)}
                        >
                            <svelte:component
                                this={tab === "time" ? ClockIcon : CalendarIcon}
                                class="h-5 w-5 [&>path]:stroke-[3]"
                            />
                        </button>
                    {/each}
                </div>
            </div>

            {#if isTimeTabActive}
                <TimePicker {task} {items} on:defer={handleDefer} />
            {:else}
                <DatePicker {task} {tz} {items} on:defer={handleDefer} />
            {/if}
        {/if}
    </div>
{/key}

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
