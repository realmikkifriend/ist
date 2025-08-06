<script lang="ts">
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { Icon, ChevronUp, ChevronDown } from "svelte-hero-icons";
    import { getCalendarGrid, getInfoForDay } from "../../utils/calendarUtils";
    import CalendarDay from "./CalendarDay.svelte";
    import type { Task } from "../../types/todoist";

    export let dateInfo: Record<string, { dots: { color: string }[]; tasks: Task[] }> = {};
    export let onDayClick: ((day: DateTime) => void) | undefined = undefined;
    export let disable: "past" | "future" | null = null;

    const displayMonth = writable({
        date: DateTime.now(),
        days: [] as (DateTime | null)[],
    });

    $: if ($displayMonth.date) {
        $displayMonth.days = getCalendarGrid($displayMonth.date);
    }
    $: disablePrevMonth =
        disable === "past" && $displayMonth.date.startOf("month") <= today.startOf("month");
    $: disableNextMonth =
        disable === "future" && $displayMonth.date.endOf("month") >= today.endOf("month");

    const today = DateTime.now().startOf("day");
    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    /**
     * Navigates to the previous or next month.
     * @param months - The number of months to move. Negative for past, positive for future.
     */
    function changeMonth(months: number) {
        const newDate = $displayMonth.date.plus({ months });
        if (
            (disable === "past" && newDate < today.startOf("month")) ||
            (disable === "future" && newDate > today.endOf("month"))
        ) {
            return;
        }
        $displayMonth.date = newDate;
    }
</script>

<div class="w-full">
    <div class="mx-3 my-5 flex items-center justify-between">
        <div class="font-bold">{$displayMonth.date.monthLong} {$displayMonth.date.year}</div>
        <div class="flex items-center">
            <button
                on:click={() => changeMonth(-1)}
                class="hover:text-primary disabled:hover:bg-base-100 flex h-7 w-7 items-center justify-center rounded-sm hover:bg-gray-200"
                disabled={disablePrevMonth}
            >
                <Icon src={!disablePrevMonth ? ChevronUp : ""} />
            </button>
            <button
                on:click={() => changeMonth(1)}
                class="hover:text-primary disabled:hover:bg-base-100 flex h-7 w-7 items-center justify-center rounded-sm hover:bg-gray-200"
                disabled={disableNextMonth}
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
        {#each $displayMonth.days as day, i (day ? day.toMillis() : `empty-${i}`)}
            {#if day}
                {@const info = getInfoForDay(day, dateInfo)}
                {#if onDayClick}
                    <button
                        class="hover:bg-primary w-full cursor-pointer rounded-sm text-left disabled:hover:bg-transparent"
                        on:click={() => onDayClick(day)}
                        disabled={(disable === "past" && day < today) ||
                            (disable === "future" && day > today)}
                    >
                        <CalendarDay
                            dots={info?.dots ?? []}
                            tooltip={info?.tasks}
                            {day}
                            {disable}
                        />
                    </button>
                {:else}
                    <div class="w-full rounded-sm text-left">
                        <CalendarDay
                            dots={info?.dots ?? []}
                            tooltip={info?.tasks}
                            {day}
                            {disable}
                        />
                    </div>
                {/if}
            {:else}
                <div class="h-7 w-full"></div>
            {/if}
        {/each}
    </div>
</div>
