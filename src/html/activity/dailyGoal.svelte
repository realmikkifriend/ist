<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData } from "./../../js/stores";
    import { getActivity } from "./activity";
    import { writable } from "svelte/store";
    import { getContextColors, getGridColsClass } from "../../js/classes";
    import type { TaskActivity } from "../../../types/todoist";

    const result = writable<TaskActivity[]>([]);
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
        result.set(activity.data.sort((a, b) => a.contextId.localeCompare(b.contextId)));

        if (activity.promise) {
            const promisedActivity = await activity.promise;
            result.set(promisedActivity.sort((a, b) => a.contextId.localeCompare(b.contextId)));
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

<div class="tooltip min-w-32">
    <div class="tooltip-content ml-14 w-60 text-left">
        {#if $result && $result.length > 0}
            Tasks completed today...
            <ul class="my-2 ml-5 list-disc">
                {#each $result as r (r.date)}
                    <li>{r.title}</li>
                {/each}
            </ul>
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
        class="badge badge-outline grid h-4 w-32 {getGridColsClass(
            $todoistData.user.daily_goal,
        )} items-start gap-0 overflow-hidden p-0 whitespace-nowrap outline-1"
    >
        {#if $result.length > 0 && $todoistData?.contexts}
            {#each getContextColors($result, $todoistData.contexts) as color, i (i)}
                <div class="{color} h-full"></div>
            {/each}
        {/if}
    </div>
</div>
<div class="flex w-fit flex-row px-1 pb-0.5 text-xs text-nowrap">
    {#if $isLoading}
        <Icon src={ArrowPath} class="mt-0.5 mr-0.5 h-3.5 w-3.5 animate-spin" />
    {/if}
    {$result.length}
    / {$todoistData.user.daily_goal}
</div>
