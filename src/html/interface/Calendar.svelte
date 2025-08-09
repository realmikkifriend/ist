<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, ChevronUp, ChevronDown } from "svelte-hero-icons";
    import { getCalendarGrid, getInfoForDay } from "../../utils/calendarUtils";
    import CalendarDay from "./CalendarDay.svelte";
    import type { CalendarProps } from "../../types/interface";

    let { dateInfo = {}, onDayClick = undefined, disable = null }: CalendarProps = $props();

    const today = DateTime.now().startOf("day");

    let displayDate = $state(DateTime.now());

    const days = $derived(getCalendarGrid(displayDate));
    const disablePrevMonth = $derived(
        disable === "past" && displayDate.startOf("month") <= today.startOf("month"),
    );
    const disableNextMonth = $derived(
        disable === "future" && displayDate.endOf("month") >= today.endOf("month"),
    );

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    /**
     * Navigates to the previous or next month.
     * @param months - The number of months to move. Negative for past, positive for future.
     */
    function changeMonth(months: number) {
        const newDate = displayDate.plus({ months });
        if (
            (disable === "past" && newDate < today.startOf("month")) ||
            (disable === "future" && newDate > today.endOf("month"))
        ) {
            return;
        }
        displayDate = newDate;
    }
</script>

<div class="w-full">
    <div class="mx-3 my-5 flex items-center justify-between">
        <div class="font-bold">{displayDate.monthLong} {displayDate.year}</div>
        <div class="flex items-center">
            <button
                class="hover:text-primary disabled:hover:bg-base-100 flex h-7 w-7 items-center justify-center rounded-sm hover:bg-gray-200"
                disabled={disablePrevMonth}
                onclick={() => changeMonth(-1)}
                type="button"
            >
                <Icon src={!disablePrevMonth ? ChevronUp : ""} />
            </button>
            <button
                class="hover:text-primary disabled:hover:bg-base-100 flex h-7 w-7 items-center justify-center rounded-sm hover:bg-gray-200"
                disabled={disableNextMonth}
                onclick={() => changeMonth(1)}
                type="button"
            >
                <Icon src={!disableNextMonth ? ChevronDown : ""} />
            </button>
        </div>
    </div>
    <div class="grid grid-cols-7 gap-x-0.5 gap-y-1">
        {#each weekDays as day, i (i)}
            <div class="text-secondary flex h-3 w-full items-center justify-center font-bold">
                {day}
            </div>
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
    </div>
</div>
