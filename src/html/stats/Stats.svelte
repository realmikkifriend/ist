<script lang="ts">
    import { onMount } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, XCircle, PlusCircle } from "svelte-hero-icons";
    import { todoistData, taskActivity, statsHistoryWindow } from "../../stores/stores";
    import { fetchCompletionHistory } from "../../services/statsService";
    import { mergeActivity } from "../../utils/activityUtils";
    import {
        buildDayStatsRows,
        extendStatsWindow,
        fetchRangeForWindow,
        getLongestIdleTasks,
        initialStatsWindow,
    } from "../../utils/statsUtils";
    import StatsChart from "./StatsChart.svelte";
    import type { StatsHistoryWindow } from "../../types/stats";

    // Guards against writes from history fetches that resolve after the view
    // is closed (e.g. a reload just before Log Out), which would re-persist
    // the stores after a reset.
    let mounted = $state(true);
    onMount(() => () => {
        mounted = false;
    });

    let isLoading = $state(false);

    let statsWindow: StatsHistoryWindow = $derived($statsHistoryWindow ?? initialStatsWindow());

    let dayRows = $derived(buildDayStatsRows($taskActivity, statsWindow, $todoistData.contexts));

    let longestIdle = $derived(getLongestIdleTasks($todoistData.tasks, $taskActivity));

    /**
     * Fetches a range of completion history and stores the results along
     * with the fetched window.
     * @param range - The date range to fetch.
     * @param next - The window to record afterwards.
     */
    const saveHistory = async (range: [DateTime, DateTime], next: StatsHistoryWindow) => {
        const fetched = await fetchCompletionHistory(range);
        if (!mounted) {
            return;
        }
        $taskActivity = mergeActivity($taskActivity, fetched);
        $statsHistoryWindow = next;
        isLoading = false;
    };

    /**
     * Fetches the history not yet covered by the stored window.
     */
    const refreshHistory = () => {
        const range = fetchRangeForWindow($statsHistoryWindow);
        if (!range || isLoading) {
            return;
        }
        isLoading = true;
        const next = { ...statsWindow, newest: range[1].toISODate() ?? "" };
        void saveHistory(range, next);
    };
    onMount(() => refreshHistory());

    /**
     * Extends the history window two weeks back and fetches the new chunk.
     */
    const retrieveMore = () => {
        if (isLoading || !$statsHistoryWindow) {
            return;
        }
        isLoading = true;
        const { range, next } = extendStatsWindow($statsHistoryWindow);
        void saveHistory(range, next);
    };

    /**
     * Closes the stats view by clearing the location hash.
     */
    const closeStats = (): void => {
        window.location.hash = "";
    };
</script>

<div id="stats" class="-mt-8 mr-4 max-w-lg sm:mx-auto sm:max-w-96">
    <div class="flex items-center justify-between pb-2 pl-16">
        <button
            class="relative rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
            class:cursor-progress={isLoading}
            onclick={retrieveMore}
            title="Retrieve more history"
            type="button"
        >
            <Icon class="h-5 w-6" src={PlusCircle} />
        </button>
        <div class="mr-6 flex grow cursor-default flex-col items-center">
            <h1 class="flex-1 text-center">Stats</h1>
            <h2 class="text-center">Completions since {statsWindow.oldest}</h2>
        </div>
        <button
            class="rounded-full p-1 transition-colors duration-200 hover:bg-red-700"
            onclick={closeStats}
            title="Close stats"
            type="button"
        >
            <Icon class="h-5 w-6" src={XCircle} />
        </button>
    </div>

    <section class="mb-6 w-full">
        <h2 class="mb-1 text-center text-sm font-semibold">Completions per day</h2>
        <StatsChart rows={dayRows} />
    </section>

    <section class="w-full">
        <h2 class="mb-1 text-center text-sm font-semibold">Longest without a completion</h2>
        <ul class="stats-longest">
            {#each longestIdle as entry (entry.taskId)}
                <li
                    class="stats-longest-item border-base-300 flex items-center justify-between border-b py-1"
                >
                    <span>{entry.title}</span>
                    <span class="text-xs">{entry.days} days</span>
                </li>
            {/each}
        </ul>
    </section>
</div>
