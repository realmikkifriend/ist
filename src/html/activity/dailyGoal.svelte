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

<div class="relative w-fit">
    <div
        class="badge badge-outline grid h-4 w-24 {getGridColsClass(
            $todoistData.user.daily_goal,
        )} items-start gap-0 overflow-hidden whitespace-nowrap p-0 outline-2"
    >
        {#if $result.length > 0 && $todoistData?.contexts}
            {#each getContextColors($result, $todoistData.contexts) as color, i (i)}
                <div class="{color} h-full"></div>
            {/each}
        {/if}
    </div>
</div>
<div class="flex w-fit flex-row text-nowrap px-1 pb-0.5 text-xs">
    {#if $isLoading}
        <Icon src={ArrowPath} class="mr-0.5 mt-0.5 h-3.5 w-3.5 animate-spin" />
    {/if}
    {$result.length}
    / {$todoistData.user.daily_goal}
</div>
