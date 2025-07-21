<script>
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { updateCalendarCells } from "./defer.js";

    export let taskToDefer, tz, tasks;

    let calendarElement;

    const tomorrowStr = DateTime.now().setZone(tz).plus({ days: 1 }).toISODate();

    afterUpdate(() => updateCalendarCells(calendarElement, tz, tasks, taskToDefer));

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: rawTime }) => {
        // valueDefault = undefined;
        dispatch("defer", { rawTime });
    };
</script>

<button
    bind:this={calendarElement}
    on:click={() => updateCalendarCells(calendarElement, tz, tasks, taskToDefer)}
>
    <SveltyPicker
        startDate={tomorrowStr}
        pickerOnly="true"
        mode="date"
        todayBtnClasses="display: hidden"
        clearBtnClasses="display: hidden"
        on:change={handleDefer}
    />
</button>
