<script lang="ts">
    import { onMount } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, XCircle, PlusCircle, Calendar } from "svelte-hero-icons";
    import { todoistData, taskActivity, statsHistoryWindow } from "../../stores/stores";
    import { fetchCompletionHistory } from "../../services/statsService";
    import { openAgenda } from "../../services/agendaService";
    import { mergeActivity } from "../../utils/activityUtils";
    import {
        extendStatsWindow,
        fetchRangeForWindow,
        initialStatsWindow,
        statsWindowDays,
    } from "../../utils/statsUtils";
    import { buildDayStatsRows } from "../../utils/statsChartUtils";
    import { getLongestIdleTasks } from "../../utils/longestIdleUtils";
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

    let longestIdle = $derived(
        getLongestIdleTasks($todoistData.tasks, $taskActivity, statsWindowDays(statsWindow)),
    );

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
    <div class="grid grid-cols-[1fr_auto_1fr] items-center pb-2">
        <button
            class="relative rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
            aria-label="Agenda"
            onclick={() => openAgenda("today")}
            title="Open today's agenda"
            type="button"
        >
            <Icon class="h-5 w-6" src={Calendar} />
            <kbd>a</kbd>
        </button>
        <h1 class="cursor-default text-center">Stats</h1>
        <div class="flex justify-end">
            <button
                class="rounded-full p-1 transition-colors duration-200 hover:bg-red-700"
                onclick={closeStats}
                title="Close stats"
                type="button"
            >
                <Icon class="h-5 w-6" src={XCircle} />
            </button>
        </div>
    </div>

    <section class="mb-6 w-full">
        <StatsChart rows={dayRows} />
        <div class="mt-2 flex justify-center">
            <button
                class="bg-neutral text-primary-content hover:bg-base-300 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors duration-200"
                class:cursor-progress={isLoading}
                onclick={retrieveMore}
                title="Retrieve more history"
                type="button"
            >
                <Icon class="h-4 w-4" src={PlusCircle} />
                <span>Load more</span>
            </button>
        </div>
    </section>

    <section class="w-full">
        <div class="card bg-neutral text-primary-content rounded-xl p-3">
            <h2 class="mb-1 text-center text-sm font-semibold">Longest without a completion</h2>
            <ul class="stats-longest">
                {#each longestIdle as entry (entry.taskId)}
                    <li
                        class="stats-longest-item border-base-300 flex items-center justify-between border-b py-1"
                    >
                        <span>{entry.title}</span>
                        <span class="min-w-16 text-right text-xs"
                            >{entry.days}{entry.beyondWindow ? "+" : ""} days</span
                        >
                    </li>
                {/each}
            </ul>
        </div>
    </section>
</div>
