<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData } from "./../../js/stores";
    import { getActivity } from "./activity";
    import { writable } from "svelte/store";
    import { getContextColors, colorClasses } from "../../js/classes";
    import type { TaskActivity, ColorName } from "../../../types/todoist";

    const sortedLists = writable<{ byContext: TaskActivity[]; byTime: TaskActivity[] }>({
        byContext: [],
        byTime: [],
    });
    const isLoading = writable<boolean>(true);

    const debounceState: { timeoutId: ReturnType<typeof setTimeout> | null } = { timeoutId: null };

    $: dailyGoal = $todoistData.user.daily_goal;

    /**
     * Creates dataset for display.
     * @returns Task activity data for today.
     */
    async function fetchDailyActivity() {
        const startOfToday = DateTime.now().startOf("day");
        const endOfToday = DateTime.now().endOf("day");

        const activity = getActivity([startOfToday, endOfToday]);

        const sortActivitiesByColor = (activities: TaskActivity[]) => {
            const colorOrder = Object.keys(colorClasses);
            return [...activities].sort((a, b) => {
                const aContext = $todoistData.contexts.find((c) => c.id === a.contextId);
                const bContext = $todoistData.contexts.find((c) => c.id === b.contextId);
                const aColorIndex = aContext ? colorOrder.indexOf(aContext.color as ColorName) : -1;
                const bColorIndex = bContext ? colorOrder.indexOf(bContext.color as ColorName) : -1;
                return aColorIndex - bColorIndex;
            });
        };

        const byContext = sortActivitiesByColor(activity.data);
        const byTime = [...activity.data].sort((a, b) => a.date.toMillis() - b.date.toMillis());

        sortedLists.set({ byContext, byTime });

        if (activity.promise) {
            const promisedActivity = await activity.promise;
            const combinedActivity = [...activity.data, ...promisedActivity];
            const uniqueActivity = Array.from(
                new Map(
                    combinedActivity.map((item) => [
                        item.date.startOf("day").toMillis() + item.taskId,
                        item,
                    ]),
                ).values(),
            );

            const promisedByContext = sortActivitiesByColor(uniqueActivity);
            const promisedByTime = [...uniqueActivity].sort(
                (a, b) => a.date.toMillis() - b.date.toMillis(),
            );
            sortedLists.set({ byContext: promisedByContext, byTime: promisedByTime });
        }

        isLoading.set(false);
    }

    $: if ($todoistData.tasks) {
        if (debounceState.timeoutId) {
            clearTimeout(debounceState.timeoutId);
        }

        debounceState.timeoutId = setTimeout(() => {
            isLoading.set(true);
            void fetchDailyActivity();
        }, 2000);
    }
</script>

<div class="tooltip min-w-32" class:cursor-progress={$isLoading}>
    <div class="tooltip-content ml-24 w-80 text-left">
        {#if $sortedLists.byTime && $sortedLists.byTime.length > 0}
            {$sortedLists.byTime.length} tasks completed today...
            <div class="my-2 space-y-1">
                {#each $sortedLists.byTime as r (r.date.startOf("day").toMillis() + r.taskId)}
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
        <p>... out of your goal of {$todoistData.user.daily_goal}</p>
        {#if $isLoading}
            <hr class="my-1" />
            <p class="text-xs">Checking for more...</p>
        {/if}
    </div>
    <div class="flex w-full min-w-36 flex-row items-center">
        <div
            class="badge badge-outline outline-secondary flex h-3 items-start gap-0 overflow-hidden rounded-full border-0 p-0 whitespace-nowrap outline-1"
            class:w-full={$sortedLists.byContext.length === 0}
            class:rounded-r-none={$sortedLists.byContext.length > dailyGoal}
            style="flex-grow: {dailyGoal};"
        >
            {#if $sortedLists.byContext.length > 0 && $todoistData?.contexts}
                {#each getContextColors($sortedLists.byContext.slice(0, dailyGoal), $todoistData.contexts) as color, i (i)}
                    <div class="{color} h-full grow"></div>
                {/each}
                {#if $sortedLists.byContext.length < dailyGoal}
                    {#each Array(dailyGoal - $sortedLists.byContext.length) as _, i (i)}
                        <div class="h-full grow"></div>
                    {/each}
                {/if}
            {/if}
        </div>
        {#if $sortedLists.byContext.length > dailyGoal && $todoistData?.contexts}
            <div
                class="flex h-4 flex-row items-start gap-0 overflow-hidden rounded-r-full border-2 border-l-0 border-lime-500 p-0 whitespace-nowrap"
                style="flex-grow: {$sortedLists.byContext.slice(dailyGoal).length};"
            >
                {#each getContextColors($sortedLists.byContext.slice(dailyGoal), $todoistData.contexts) as color, i (i)}
                    <div class="{color} h-full grow"></div>
                {/each}
            </div>
        {/if}
    </div>
</div>
<div class="ml-2 flex w-fit flex-row pb-0.5 text-xs text-nowrap">
    {#if $isLoading}
        <Icon src={ArrowPath} class="mt-0.5 mr-0.5 h-3.5 w-3.5 animate-spin" />
    {/if}
    <span class="mr-1" class:text-lime-500={$sortedLists.byContext.length > dailyGoal}>
        {$sortedLists.byContext.length}
    </span>
    / {dailyGoal} tasks done
</div>
