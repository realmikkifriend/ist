<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData } from "./../../js/stores";
    import { getActivity } from "./activity";
    import { writable } from "svelte/store";
    import { getContextColors, getGridColsClass } from "../../js/classes";
    import type { TaskActivity } from "../../../types/todoist";

    const sortedLists = writable<{ byContext: TaskActivity[]; byTime: TaskActivity[] }>({
        byContext: [],
        byTime: [],
    });
    const isLoading = writable<boolean>(true);

    const debounceState: { timeoutId: ReturnType<typeof setTimeout> | null } = { timeoutId: null };

    /**
     * Creates dataset for display.
     * @returns Task activity data for today.
     */
    async function fetchDailyActivity() {
        const startOfToday = DateTime.now().startOf("day");
        const endOfToday = DateTime.now().endOf("day");

        const activity = getActivity([startOfToday, endOfToday]);

        const byContext = [...activity.data].sort((a, b) => a.contextId.localeCompare(b.contextId));
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

            const promisedByContext = [...uniqueActivity].sort((a, b) =>
                a.contextId.localeCompare(b.contextId),
            );
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
    <div
        class="badge badge-outline grid h-3 w-36 {getGridColsClass(
            $todoistData.user.daily_goal,
        )} items-start gap-0 overflow-hidden p-0 whitespace-nowrap outline-1"
    >
        {#if $sortedLists.byContext.length > 0 && $todoistData?.contexts}
            {#each getContextColors($sortedLists.byContext, $todoistData.contexts) as color, i (i)}
                <div class="{color} h-full"></div>
            {/each}
        {/if}
    </div>
</div>
<div class="ml-2 flex w-fit flex-row pb-0.5 text-xs text-nowrap">
    {#if $isLoading}
        <Icon src={ArrowPath} class="mt-0.5 mr-0.5 h-3.5 w-3.5 animate-spin" />
    {/if}
    {$sortedLists.byContext.length}
    / {$todoistData.user.daily_goal} tasks done
</div>
