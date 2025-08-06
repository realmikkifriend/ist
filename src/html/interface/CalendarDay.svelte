<script lang="ts">
    import { DateTime } from "luxon";
    import ListTask from "../task/ListTask.svelte";
    import type { Task } from "../../types/todoist";

    export let day: DateTime;
    export let dots: { color: string }[];
    export let tooltip: Task[] | undefined = undefined;
    export let disable: "past" | "future" | null = null;

    const today = DateTime.now().startOf("day");
    const tomorrow = today.plus({ days: 1 });

    const isDisabled = (disable === "past" && day < today) || (disable === "future" && day > today);
    const isTomorrow = day.hasSame(tomorrow, "day") && disable !== "future";
</script>

<div
    class="tooltip tooltip-top relative flex h-9 w-full flex-col items-center justify-center rounded-sm"
    class:bg-red-950={day.hasSame(today, "day")}
    class:bg-red-800={isTomorrow}
    class:opacity-50={isDisabled}
    class:hover:bg-transparent={isDisabled}
    class:cursor-not-allowed={isDisabled}
>
    {#if tooltip}
        <div class="tooltip-content w-44 text-left">
            {#each tooltip as task (task.id)}
                <ListTask {task} />
            {/each}
        </div>
        <span>{day.day}</span>
    {:else}
        <span>{day.day}</span>
    {/if}

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
