<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData } from "../../stores/stores";
    import { fetchDailyActivity } from "../../services/activityService";
    import { getContextColors } from "../../utils/styleUtils";
    import DailyGoalTooltip from "./DailyGoalTooltip.svelte";
    import type { TaskActivity } from "../../types/activity";

    let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;

    let sortedLists: { byContext: TaskActivity[]; byTime: TaskActivity[] } = $derived({
        byContext: [],
        byTime: [],
    });
    let isLoading: boolean = $derived(true);

    let dailyGoal = $derived($todoistData.user.daily_goal);

    $effect(() => {
        if ($todoistData.tasks) {
            if (debounceTimeoutId) {
                clearTimeout(debounceTimeoutId);
            }

            debounceTimeoutId = setTimeout(() => {
                const activity = fetchDailyActivity();
                sortedLists = activity.preliminary as {
                    byContext: TaskActivity[];
                    byTime: TaskActivity[];
                };

                if (activity.promise) {
                    isLoading = true;
                    void (
                        activity.promise as Promise<{
                            byContext: TaskActivity[];
                            byTime: TaskActivity[];
                        }>
                    ).then((promisedActivity) => {
                        sortedLists = promisedActivity;
                        isLoading = false;
                    });
                } else {
                    isLoading = false;
                }
            }, 2000);
        }
    });
</script>

<div class="tooltip min-w-32" class:cursor-progress={isLoading}>
    <DailyGoalTooltip {dailyGoal} {isLoading} sortedByTime={sortedLists.byTime} />
    <div class="flex w-full min-w-36 flex-row items-center">
        <div
            style:flex-grow={dailyGoal}
            class="badge badge-outline outline-secondary flex h-3 items-start gap-0 overflow-hidden rounded-full border-0 p-0 whitespace-nowrap outline-1"
            class:rounded-r-none={sortedLists.byContext.length > dailyGoal}
            class:w-full={sortedLists.byContext.length === 0}
        >
            {#if sortedLists.byContext.length > 0 && $todoistData?.contexts}
                {#each getContextColors(sortedLists.byContext.slice(0, dailyGoal), $todoistData.contexts) as color, i (i)}
                    <div class="{color} h-full grow"></div>
                {/each}
                {#if sortedLists.byContext.length < dailyGoal}
                    {#each Array(dailyGoal - sortedLists.byContext.length) as _, i (i)}
                        <div class="h-full grow"></div>
                    {/each}
                {/if}
            {/if}
        </div>
        {#if sortedLists.byContext.length > dailyGoal && $todoistData?.contexts}
            <div
                style:flex-grow={sortedLists.byContext.slice(dailyGoal).length}
                class="flex h-4 flex-row items-start gap-0 overflow-hidden rounded-r-full border-2 border-l-0 border-lime-500 p-0 whitespace-nowrap"
            >
                {#each getContextColors(sortedLists.byContext.slice(dailyGoal), $todoistData.contexts) as color, i (i)}
                    <div class="{color} h-full grow"></div>
                {/each}
            </div>
        {/if}
    </div>
</div>
<div class="ml-2 flex w-fit flex-row pb-0.5 text-xs text-nowrap">
    {#if isLoading || !dailyGoal}
        <Icon class="mt-0.5 mr-0.5 h-3.5 w-3.5 animate-spin" src={ArrowPath} />
    {/if}
    {#if dailyGoal}
        <span class="mr-1" class:text-lime-500={sortedLists.byContext.length > dailyGoal}>
            {sortedLists.byContext.length}
        </span>
        / {dailyGoal} tasks done
    {:else}
        loading goal...
    {/if}
</div>
