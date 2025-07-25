<script lang="ts">
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { updateCalendarCells } from "./deferButtonsDate";
    import type { Task } from "../../../types/todoist";

    export let taskToDefer: Task;
    export let tz: string;
    export let tasks: Task[];

    const tomorrowStr: string = DateTime.now().setZone(tz).plus({ days: 1 }).toISODate() ?? "";

    const dispatch = createEventDispatcher<{ defer: { rawTime: string } }>();

    /**
     * Handles the defer event from the date picker.
     * @param param0 - The event object containing the raw time string.
     * @param param0.detail - Defer information to pass.
     */
    const handleDefer = ({ detail: rawTime }: { detail: string }): void => {
        dispatch("defer", { rawTime });
    };

    /**
     * Handles the click event on the calendar button.
     * @param event - The click event on the calendar button.
     */
    const handleButtonClick = (event: Event): void => {
        updateCalendarCells(event.currentTarget as HTMLElement, tz, tasks, taskToDefer);
    };

    /**
     * Handles updates after the component has been updated.
     */
    const handleAfterUpdate = (): void => {
        const buttonElement = document.querySelector("button[data-calendar-button]");
        if (buttonElement) {
            updateCalendarCells(buttonElement as HTMLElement, tz, tasks, taskToDefer);
        }
    };

    afterUpdate(handleAfterUpdate);
</script>

<button data-calendar-button on:click={handleButtonClick}>
    <SveltyPicker
        startDate={tomorrowStr}
        pickerOnly={true}
        mode="date"
        todayBtnClasses="display: hidden"
        clearBtnClasses="display: hidden"
        on:change={handleDefer}
    />
</button>
