<script lang="ts">
    import { DateTime } from "luxon";
    import { getCalendarGrid, getInfoForDay } from "../../utils/calendarUtils";
    import CalendarHeader from "./CalendarHeader.svelte";
    import CalendarDay from "./CalendarDay.svelte";
    import type { CalendarProps } from "../../types/interface";

    let { dateInfo = {}, onDayClick = undefined, disable = null }: CalendarProps = $props();

    const today = DateTime.now().startOf("day");

    let displayDate = $state(DateTime.now());

    const days = $derived(getCalendarGrid(displayDate));
    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    /**
     * Changes the displayed month to the provided new month.
     * @param newDate - The provided new month.
     */
    function handleMonthChange(newDate: DateTime) {
        displayDate = newDate;

        const firstNonDisabledButton = document.querySelector(
            ".grid-cols-7 button:not([disabled])",
        ) as HTMLButtonElement;
        if (firstNonDisabledButton) {
            firstNonDisabledButton.focus();
        }
    }
</script>

<div class="w-full">
    <CalendarHeader {disable} {displayDate} onchangeMonth={handleMonthChange} />
    <div class="relative grid grid-cols-7 gap-x-0.5 gap-y-1">
        {#each weekDays as day, i (i)}
            <div class="text-secondary flex h-3 w-full justify-center font-bold">{day}</div>
        {/each}
        {#each days as day, i (day ? day.toMillis() : `empty-${i}`)}
            {#if day}
                {@const info = getInfoForDay(day, dateInfo)}
                {#if onDayClick}
                    <button
                        class="hover:bg-primary w-full cursor-pointer rounded-sm text-left disabled:hover:bg-transparent"
                        disabled={(disable === "past" && day < today) ||
                            (disable === "future" && day > today)}
                        onclick={() => onDayClick(day)}
                        type="button"
                    >
                        <CalendarDay
                            {day}
                            {disable}
                            dots={info?.dots ?? []}
                            tooltip={info?.tasks}
                        />
                    </button>
                {:else}
                    <div class="w-full rounded-sm text-left">
                        <CalendarDay
                            {day}
                            {disable}
                            dots={info?.dots ?? []}
                            tooltip={info?.tasks}
                        />
                    </div>
                {/if}
            {:else}
                <div class="h-7 w-full"></div>
            {/if}
        {/each}
        <kbd>TAB</kbd>
    </div>
</div>
