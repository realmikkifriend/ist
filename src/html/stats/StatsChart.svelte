<script lang="ts">
    import { scaleBand } from "d3-scale";
    import { DateTime } from "luxon";
    import { LayerCake, Svg } from "layercake";
    import type { LayerCakeContext } from "layercake";
    import { todoistData } from "../../stores/stores";
    import { chartFillClasses } from "../../styles/styleUtils";
    import { chartColumns, isWeekBoundary, totalColorClass } from "../../utils/statsChartUtils";
    import StatsDayTooltip from "./StatsDayTooltip.svelte";
    import type { StatsDayRow } from "../../types/stats";

    let { rows }: { rows: StatsDayRow[] } = $props();

    const rowHeight = 14;
    /** Extra space inserted below a Sunday row to separate the weeks. */
    const weekGap = 6;
    const leftPad = 128;
    const rightPad = 30;
    const colGap = 2;
    const todayIso = DateTime.now().toISODate() ?? "";

    const dailyGoal = $derived($todoistData.user.dailyGoal);

    const columns = $derived(chartColumns(rows));

    /**
     * The week gap following each row: present when the next (older) row falls
     * in a different week, so a visible gap separates the weeks.
     */
    const afterRowGaps = $derived(
        rows.map((row, i) =>
            rows[i + 1] ? (isWeekBoundary(row.date, rows[i + 1].date) ? weekGap : 0) : 0,
        ),
    );
    /** Running totals of the gaps, so `cumulativeGaps[i]` is all gap after row i. */
    const cumulativeGaps = $derived(
        afterRowGaps.reduce<number[]>((acc, gap, i) => [...acc, (acc[i - 1] ?? 0) + gap], []),
    );
    /** Vertical offset of each row, including the week gaps above it. */
    const rowOffsets = $derived(
        rows.map((_, i) => i * rowHeight + (i === 0 ? 0 : (cumulativeGaps[i - 1] ?? 0))),
    );

    const chartHeight = $derived(
        rows.length > 0 ? rows.length * rowHeight + (cumulativeGaps[rows.length - 2] ?? 0) + 4 : 4,
    );

    const yDomain = $derived(rows.map((row) => row.date));

    /**
     * Formats a row date with its abbreviated weekday.
     * @param date - A local ISO date.
     * @returns E.g. "Mon 2026-10-01".
     */
    const dayLabel = (date: string): string => DateTime.fromISO(date).toFormat("ccc yyyy-MM-dd");

    /**
     * Toggles the row tooltip's open state (daisyUI tooltip).
     * @param element - The row element whose tooltip is toggled.
     * @param open - Whether the tooltip should be open.
     */
    const showTooltip = (element: Element, open: boolean): void => {
        element.classList.toggle("tooltip-open", open);
    };
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
                {@const totalMax = columns.reduce((sum, column) => sum + column.maxCount, 0)}
                {@const columnLayout = columns.map((column, i) => {
                    const width = totalMax > 0 ? (column.maxCount / totalMax) * k.width : 0;
                    const start = columns
                        .slice(0, i)
                        .reduce(
                            (sum, previous) => sum + (previous.maxCount / totalMax) * k.width,
                            0,
                        );
                    return { ...column, width, start };
                })}
                <Svg pointerEvents={false}>
                    {#each rows as row, rowIndex (row.date)}
                        {@const isToday = row.date === todayIso}
                        <g
                            class="stats-day"
                            class:stats-day-today={isToday}
                            data-date={row.date}
                            transform={`translate(0, ${rowOffsets[rowIndex]})`}
                        >
                            {#if isToday}
                                <rect
                                    class="stats-today-band fill-current opacity-10"
                                    height={rowHeight}
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
                                    height={rowHeight - 1}
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
                                y={rowHeight / 2}
                            >
                                {dayLabel(row.date)}
                            </text>
                            <text
                                class={`stats-day-total ${totalColorClass(row.total, dailyGoal)}`}
                                class:font-bold={isToday}
                                dominant-baseline="middle"
                                x={k.width + 4}
                                y={rowHeight / 2}
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
                    style:height="{rowHeight}px"
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
