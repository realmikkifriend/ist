<script>
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { updateCalendarCells } from "./defer.js";

    export let taskToDefer, tz, tasks;

    const tomorrowStr = DateTime.now().setZone(tz).plus({ days: 1 }).toISODate();

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: rawTime }) => {
        dispatch("defer", { rawTime });
    };

    const handleButtonClick = (event) => {
        updateCalendarCells(event.currentTarget, tz, tasks, taskToDefer);
    };

    const handleAfterUpdate = () => {
        const buttonElement = document.querySelector("button[data-calendar-button]");
        if (buttonElement) {
            updateCalendarCells(buttonElement, tz, tasks, taskToDefer);
        }
    };

    afterUpdate(handleAfterUpdate);
</script>

<button data-calendar-button on:click={handleButtonClick}>
    <SveltyPicker
        startDate={tomorrowStr}
        pickerOnly="true"
        mode="date"
        todayBtnClasses="display: hidden"
        clearBtnClasses="display: hidden"
        on:change={handleDefer}
    />
</button>
