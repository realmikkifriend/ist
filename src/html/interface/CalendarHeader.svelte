<script lang="ts">
    import { onMount } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, ChevronUp, ChevronDown } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import type { CalendarHeaderProps } from "../../types/interface";

    let { disable = null, displayDate, onchangeMonth }: CalendarHeaderProps = $props();

    const today = DateTime.now().startOf("day");

    const monthButtons = $derived([
        {
            months: -1,
            disabled: disable === "past" && displayDate.startOf("month") <= today.startOf("month"),
            icon: ChevronUp,
        },
        {
            months: 1,
            disabled: disable === "future" && displayDate.endOf("month") >= today.endOf("month"),
            icon: ChevronDown,
        },
    ]);

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
        onchangeMonth(newDate);
    }

    onMount(() => {
        const firstNonDisabledButton = document.querySelector(
            ".grid-cols-7 button:not([disabled])",
        ) as HTMLButtonElement;
        if (firstNonDisabledButton) {
            firstNonDisabledButton.focus();
        }
    });
</script>

<div class="mx-3 my-5 flex items-center justify-between">
    <div class="font-bold">{displayDate.monthLong} {displayDate.year}</div>

    <div class="flex items-center">
        {#each monthButtons as { months, disabled, icon } (months)}
            <button
                class="hover:text-primary disabled:hover:bg-base-100 relative h-7 w-7 rounded-sm hover:bg-gray-200"
                {disabled}
                onclick={() => changeMonth(months)}
                type="button"
            >
                <Icon class="absolute inset-0 m-auto" src={!disabled ? icon : ""} />
                {#if !disabled}
                    <kbd class="absolute top-0 right-0 text-[0.5rem]"
                        >{months === -1 ? "↑" : "↓"}</kbd
                    >
                {/if}
            </button>
        {/each}
    </div>
</div>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "ArrowUp",
                callback: () => changeMonth(-1),
            },
            {
                key: "ArrowDown",
                callback: () => changeMonth(1),
            },
        ],
    }}
/>
