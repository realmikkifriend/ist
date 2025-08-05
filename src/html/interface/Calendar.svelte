<script lang="ts">
    import CalendarDay from "./CalendarDay.svelte";
    import { DateTime } from "luxon";
    import { writable } from "svelte/store";
    import { Icon, ChevronUp, ChevronDown } from "svelte-hero-icons";

    export let dateDots: Record<string, { color: string }[]> = {};
    export let onDayClick: (day: DateTime) => void = () => {};

    // console.log(dateDots);

    const displayMonth = writable({
        date: DateTime.now(),
        days: [] as (DateTime | null)[],
    });

    $: if ($displayMonth.date) {
        getCalendarGrid();
    }

    /** Generates the calendar grid for the current month. */
    function getCalendarGrid() {
        const now = $displayMonth.date;
        const startOfMonth = now.startOf("month");
        const endOfMonth = now.endOf("month");

        const startDay = startOfMonth.weekday;

        const leadingEmptyDays: null[] = Array.from({ length: startDay - 1 }, () => null);
        const monthDays: DateTime[] = Array.from({ length: endOfMonth.day }, (_, i) =>
            DateTime.local(now.year, now.month, i + 1),
        );

        $displayMonth.days = [...leadingEmptyDays, ...monthDays] as (DateTime | null)[];
    }

    const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

    /**
     * Navigates to the previous or next month.
     * @param months - The number of months to move. Negative for past, positive for future.
     */
    function changeMonth(months: number) {
        $displayMonth.date = $displayMonth.date.plus({ months });
    }

    /**
     * Processes the day data for dot display.
     * @param day - The given day for which to retrieve dots.
     * @returns The dots to display.
     */
    function getDotsForDay(day: DateTime | null): { color: string }[] {
        if (!day) return [];

        return Object.keys(dateDots)
            .filter((isoDateTime) => DateTime.fromISO(isoDateTime).hasSame(day, "day"))
            .flatMap((isoDateTime) => dateDots[isoDateTime]);
    }
</script>

<div class="w-full">
    <div class="mx-3 my-5 flex items-center justify-between">
        <div class="font-bold">{$displayMonth.date.monthLong} {$displayMonth.date.year}</div>
        <div class="flex items-center">
            <button
                on:click={() => changeMonth(-1)}
                class="hover:text-primary flex h-5 w-5 items-center justify-center rounded-sm hover:bg-gray-200"
            >
                <Icon src={ChevronUp} />
            </button>
            <button
                on:click={() => changeMonth(1)}
                class="hover:text-primary flex h-5 w-5 items-center justify-center rounded-sm hover:bg-gray-200"
            >
                <Icon src={ChevronDown} />
            </button>
        </div>
    </div>
    <div class="grid grid-cols-7 gap-x-0.5 gap-y-1">
        {#each weekDays as day, i (i)}
            <div class="text-secondary flex h-3 w-full items-center justify-center font-bold">
                {day}
            </div>
        {/each}
        {#each $displayMonth.days as day, i (i)}
            {#if day}
                {@const dots = getDotsForDay(day)}
                <button
                    class="hover:text-primary hover:bg-neutral w-full cursor-pointer rounded-sm text-left"
                    on:click={() => onDayClick(day)}
                >
                    <CalendarDay {dots} {day} />
                </button>
            {:else}
                <div class="h-7 w-full"></div>
            {/if}
        {/each}
    </div>
</div>
