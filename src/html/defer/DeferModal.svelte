<script>
    import { createEventDispatcher } from "svelte";
    import { CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    import { DateTime } from "luxon";
    import { todoistResources } from "../../js/stores";
    import { createDateWithTime } from "../../js/time";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    export let task;

    let isTimeTabActive;
    $: isTimeTabActive = task.due.all_day !== 1;

    const selectTab = (tab) => {
        isTimeTabActive = tab === "time";
    };

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

    let tasks = [];

    $: tasks = $todoistResources.items;

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: { rawTime } }) => {
        let time;
        isTimeTabActive = true;

        if (typeof rawTime === "number") {
            const now = DateTime.now().setZone(tz);
            time = now.plus({ milliseconds: rawTime });
        } else if (typeof rawTime === "string") {
            const date = DateTime.fromISO(rawTime);
            const tomorrow = DateTime.now().plus({ days: 1 }).setZone(tz);

            const extracted = createDateWithTime(task.due.string, tomorrow);
            if (extracted.newDate === null) {
                time = date;
            } else {
                const { hour, minute } = extracted.newDate;
                time = date.set({ hour, minute });
            }
        }

        dispatch("defer", { task, time });
    };
</script>

<div class="modal-box flex min-h-[65%] w-fit flex-col justify-center">
    {#key task}
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

        {#key tasks}
            {#if isTimeTabActive}
                <TimePicker {task} {tasks} on:defer={handleDefer} />
            {:else}
                <DatePicker {task} {tz} {tasks} on:defer={handleDefer} />
            {/if}
        {/key}
    {/key}
</div>

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
