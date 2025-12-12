<script lang="ts">
    import { DateTime } from "luxon";
    import type { Task } from "../../types/todoist";

    let {
        onClose,
        onSchedule,
        task,
    }: {
        onClose: () => void;
        onSchedule: (time: DateTime) => void;
        task?: Task;
    } = $props();

    let currentView: "hours" | "times" = $state("hours");
    let selectedHour: number = $state(0);
    let selectedDate: DateTime = $state(getTargetDateFromAgendaView());

    /**
     * Determines the target date based on the current agenda view.
     * @returns DateTime for the target date
     */
    function getTargetDateFromAgendaView(): DateTime {
        const now = DateTime.now();
        const hash = window.location.hash;

        if (hash === "#tomorrow") {
            return now.plus({ days: 1 }).startOf("day");
        }

        return now.startOf("day");
    }

    /**
     * Generates hour buttons for AM/PM display
     * Returns array of { hour: number, display: string, isAm: boolean }
     */
    const hourButtons = $derived(() => {
        return Array.from({ length: 24 }, (_, i) => {
            const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
            const amPm = i < 12 ? "AM" : "PM";
            const display = `${displayHour} ${amPm}`;
            return {
                hour: i,
                display,
                isAm: i < 12,
            };
        });
    });

    /**
     * Generates time buttons for 5-minute increments
     * Returns array of { minutes: number, display: string, isQuarterHour: boolean }
     */
    const timeButtons = $derived(() => {
        return Array.from({ length: 12 }, (_, i) => {
            const minutes = i * 5;
            const time = DateTime.fromObject({
                year: selectedDate.year,
                month: selectedDate.month,
                day: selectedDate.day,
                hour: selectedHour,
                minute: minutes,
            });
            const display = time.toFormat("h:mm a");
            return {
                minutes,
                display,
                isQuarterHour: minutes % 15 === 0,
            };
        });
    });

    /**
     * Get AM hours for template
     */
    const amHours = $derived(() => hourButtons().filter((h) => h.isAm));

    /**
     * Get PM hours for template
     */
    const pmHours = $derived(() => hourButtons().filter((h) => !h.isAm));

    /**
     * Check if an hour is in the business hours range.
     * @param hour - Hour to check (0-23)
     * @returns true if hour is between 7 (7am) and 21 (9pm)
     */
    function isBusinessHour(hour: number): boolean {
        return hour >= 7 && hour <= 19;
    }

    /**
     * Handles user's hour selection.
     * @param hour - Selected hour (0-23)
     */
    function selectHour(hour: number): void {
        selectedHour = hour;
        currentView = "times";
    }

    /**
     * Handles user's specific time selection.
     * @param minutes - Selected minutes (0-55, in 5-minute increments)
     */
    function selectTime(minutes: number): void {
        const selectedTime = DateTime.fromObject({
            year: selectedDate.year,
            month: selectedDate.month,
            day: selectedDate.day,
            hour: selectedHour,
            minute: minutes,
            second: 0,
            millisecond: 0,
        });
        onSchedule(selectedTime);
    }

    /**
     * Resets modal state on close.
     */
    function resetModal(): void {
        currentView = "hours";
        selectedHour = 0;
        selectedDate = DateTime.now().startOf("day");
    }
</script>

<div class="modal-box flex min-h-[25.5rem] w-84 flex-col justify-start overflow-hidden">
    {#if task && task.due && task.due.date && task.due.date.includes("T")}
        <div class="p-0">
            <button
                class="btn bg-primary/20 hover:bg-secondary mb-2 w-full rounded-md px-2 py-2 text-sm"
                onclick={() => {
                    const noTimeDate = DateTime.fromObject({
                        year: selectedDate.year,
                        month: selectedDate.month,
                        day: selectedDate.day,
                    });
                    onSchedule(noTimeDate);
                }}
                type="button"
            >
                No time
            </button>
        </div>
    {/if}
    <div class="mt-2 flex-1 overflow-y-auto p-2">
        {#if currentView === "hours"}
            <div class="flex h-full w-full gap-2">
                {#each [amHours(), pmHours()] as hoursList (hoursList[0]?.isAm ? "am" : "pm")}
                    <div class="flex w-1/2 flex-col gap-1">
                        {#each hoursList as hour (hour.hour)}
                            <button
                                class="btn hover:bg-secondary h-8 min-h-8 w-full rounded-md px-2 py-1 text-sm {isBusinessHour(
                                    hour.hour,
                                )
                                    ? 'bg-primary/20 text-sm'
                                    : 'text-xs'}"
                                aria-label={`Select ${hour.display}`}
                                data-hour={hour.hour}
                                onclick={() => selectHour(hour.hour)}
                                type="button"
                            >
                                {hour.display}
                            </button>
                        {/each}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="flex flex-col gap-1">
                {#each timeButtons() as time (time.minutes)}
                    <button
                        class="btn hover:bg-secondary w-full rounded-md px-2 {time.isQuarterHour
                            ? 'bg-primary/20 h-8 py-2 text-sm'
                            : 'h-6 py-1 text-xs'}"
                        onclick={() => selectTime(time.minutes)}
                        type="button"
                    >
                        {time.display}
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>

<form class="modal-backdrop" method="dialog">
    <button
        onclick={() => {
            resetModal();
            onClose();
        }}
        type="submit">close</button
    >
</form>
