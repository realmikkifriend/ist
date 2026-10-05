<script lang="ts">
    import { scaleBand } from "d3-scale";
    import { DateTime } from "luxon";
    import { LayerCake, Svg } from "layercake";
    import type { LayerCakeContext } from "layercake";
    import { todoistData } from "../../stores/stores";
    import { chartFillClasses } from "../../styles/styleUtils";
    import { chartColumns, layoutColumns, ROW_HEIGHT } from "../../utils/statsChartUtils";
    import { computeStreakStatus, streakHighlightHeight } from "../../utils/streakUtils";
    import { dayLabel, rowLayout, showTooltip } from "../../utils/statsChartHelpers";
    import StatsDayTooltip from "./StatsDayTooltip.svelte";
    import type { StatsDayRow } from "../../types/stats";

    let { rows }: { rows: StatsDayRow[] } = $props();

    const highlightWidth = 18;
    const leftPad = 128;
    const rightPad = 30;
    const colGap = 2;
    const todayIso = DateTime.now().toISODate() ?? "";

    const dailyGoal = $derived($todoistData.user.dailyGoal);

    const columns = $derived(chartColumns(rows));

    const { afterRowGaps, rowOffsets, chartHeight } = $derived(rowLayout(rows));

    const hitGoal = $derived(rows.map((row) => row.total >= dailyGoal && dailyGoal > 0));
    /**
     * For each row: 0 = not in a streak of length >=2, 1 = first day of one,
     * 2 = a middle day, 3 = the last day.
     */
    const streakStatus = $derived(computeStreakStatus(hitGoal));

    const yDomain = $derived(rows.map((row) => row.date));
</script>

{#if rows.length === 0}
    <p class="text-center text-sm opacity-60">No completions in this window yet.</p>
{:else}
    <div style:height="{chartHeight}px" class="relative w-full">
        <LayerCake
            data={rows}
            padding={{ bottom: 2, left: leftPad, right: rightPad, top: 2 }}
            x={(d: StatsDayRow) => d.total}
            y={(d: StatsDayRow) => d.date}
            {yDomain}
            yScale={scaleBand()}
        >
            {#snippet children(k: LayerCakeContext)}
                {@const columnLayout = layoutColumns(columns, k.width)}
                <Svg pointerEvents={false}>
                    {#each rows as row, rowIndex (row.date)}
                        {@const isToday = row.date === todayIso}
                        <g
                            class="stats-day"
                            class:stats-day-today={isToday}
                            data-date={row.date}
                            transform={`translate(0, ${rowOffsets[rowIndex]})`}
                        >
                            {#if streakStatus[rowIndex] !== 0}
                                <rect
                                    class="fill-gray-600"
                                    height={streakHighlightHeight(
                                        row.date,
                                        rowIndex,
                                        rows,
                                        afterRowGaps,
                                    )}
                                    rx={2}
                                    ry={2}
                                    width={highlightWidth}
                                    x={k.width + 6}
                                    y={-1.5}
                                />
                            {/if}
                            {#if isToday}
                                <rect
                                    class="stats-today-band fill-current opacity-10"
                                    height={ROW_HEIGHT}
                                    width={k.width + leftPad + rightPad}
                                    x={-leftPad}
                                />
                            {/if}
                            {#each row.segments as segment (segment.color ?? "unknown")}
                                {@const colIndex = columns.findIndex(
                                    (column) => column.color === segment.color,
                                )}
                                {@const column = columnLayout[colIndex]}
                                {@const barWidth =
                                    (segment.count / column.maxCount) * (column.width - 2 * colGap)}
                                <rect
                                    class={`stats-segment ${
                                        segment.color
                                            ? chartFillClasses[segment.color]
                                            : "fill-gray-400"
                                    }`}
                                    height={ROW_HEIGHT - 1}
                                    width={barWidth}
                                    x={column.start + (column.width - barWidth) / 2}
                                />
                            {/each}
                            <text
                                class="stats-day-label fill-current"
                                class:font-bold={isToday}
                                dominant-baseline="middle"
                                text-anchor="end"
                                x={-8}
                                y={ROW_HEIGHT / 2}
                            >
                                {dayLabel(row.date)}
                            </text>
                            <text
                                class="stats-day-total"
                                class:font-bold={isToday || row.total >= dailyGoal}
                                dominant-baseline="middle"
                                fill="#f8f9fa"
                                text-anchor="middle"
                                x={k.width + rightPad / 2}
                                y={ROW_HEIGHT / 2}
                            >
                                {row.total}
                            </text>
                        </g>
                    {/each}
                </Svg>
            {/snippet}
        </LayerCake>
        <div class="pointer-events-none absolute inset-y-0.5 right-0 left-0">
            {#each rows as row, rowIndex (row.date)}
                {@const gapBefore = rowIndex > 0 ? (afterRowGaps[rowIndex - 1] ?? 0) : 0}
                <div
                    style:height="{ROW_HEIGHT}px"
                    style:margin-top="{gapBefore}px"
                    class="stats-row tooltip pointer-events-auto block w-full"
                    class:tooltip-bottom={rowIndex !== rows.length - 1}
                    class:tooltip-top={rowIndex === rows.length - 1}
                    onblur={(e) => showTooltip(e.currentTarget, false)}
                    onfocus={(e) => showTooltip(e.currentTarget, true)}
                    onmouseenter={(e) => showTooltip(e.currentTarget, true)}
                    onmouseleave={(e) => showTooltip(e.currentTarget, false)}
                    role="button"
                    tabindex="0"
                >
                    <StatsDayTooltip {row} />
                </div>
            {/each}
        </div>
    </div>
{/if}
