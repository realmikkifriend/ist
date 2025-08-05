<script lang="ts">
    import { DateTime } from "luxon";

    export let day: DateTime;
    export let dots: { color: string }[];

    const today = DateTime.now().startOf("day");
    const tomorrow = today.plus({ days: 1 });
</script>

<div
    class="relative flex h-9 w-full flex-col items-center justify-center rounded-sm"
    class:bg-red-950={day.hasSame(today, "day")}
    class:bg-red-800={day.hasSame(tomorrow, "day")}
>
    <span>{day.day}</span>
    {#if dots.length > 0}
        <div class="dot-container flex h-1 items-center justify-center space-x-0.5">
            {#each dots.slice(0, 3) as dot, i (i)}
                <div class="h-1 w-1 rounded-full {dot.color}"></div>
            {/each}
            {#if dots.length > 3}
                <div class="text-secondary w-1 text-[0.65rem] leading-none">+</div>
            {/if}
        </div>
    {/if}
</div>
