<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import type { DailyGoalTooltipProps } from "../../types/activity";

    let { dailyGoal, sortedByTime, isLoading }: DailyGoalTooltipProps = $props();
</script>

<div class="tooltip-content ml-24 w-80 text-left">
    {#if sortedByTime && sortedByTime.length > 0}
        {sortedByTime.length} tasks completed today...
        <div class="my-2 space-y-1">
            {#each sortedByTime as r (`${r.taskId}:${r.date.toMillis()}`)}
                <div class="ml-20 -indent-20">
                    <span class="font-mono tracking-tighter opacity-50"
                        >[{r.date.toFormat("hh:mm a")}]</span
                    >
                    {r.title}
                    {#if r.temporary}
                        <Icon src={ArrowPath} class="inline-block h-3 w-3 opacity-50" />
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <p>No tasks completed so far today...</p>
    {/if}
    <p>... out of your goal of {dailyGoal}</p>
    {#if isLoading}
        <hr class="my-1" />
        <p class="text-xs">Checking for more...</p>
    {/if}
</div>
