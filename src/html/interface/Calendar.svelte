<script lang="ts">
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { Icon, ChevronUp, ChevronDown } from "svelte-hero-icons";
    import CalendarDay from "./CalendarDay.svelte";
    import type { Task } from "../../types/todoist";

    export let dateInfo: Record<string, { dots: { color: string }[]; tasks: Task[] }> = {};
    export let onDayClick: (day: DateTime) => void = () => {};

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
     * Processes the day data for dot and tooltip display.
     * @param day - The given day for which to retrieve info.
     * @returns The info to display.
     */
    function getInfoForDay(
        day: DateTime | null,
    ): { dots: { color: string }[]; tasks: Task[] } | null {
        if (!day) return null;

        const infos = Object.keys(dateInfo)
            .filter((isoDateTime) => DateTime.fromISO(isoDateTime).hasSame(day, "day"))
            .map((isoDateTime) => dateInfo[isoDateTime]);

        if (infos.length === 0) {
            return null;
        }

        return infos.reduce(
            (acc, info) => {
                acc.dots.push(...info.dots);
                acc.tasks.push(...info.tasks);
                return acc;
            },
            { dots: [], tasks: [] },
        );
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
                {@const info = getInfoForDay(day)}
                <button
                    class="hover:text-primary hover:bg-neutral w-full cursor-pointer rounded-sm text-left"
                    on:click={() => onDayClick(day)}
                >
                    <CalendarDay dots={info?.dots ?? []} tooltip={info?.tasks} {day} />
                </button>
            {:else}
                <div class="h-7 w-full"></div>
            {/if}
        {/each}
    </div>
</div>
