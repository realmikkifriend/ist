<script lang="ts">
    import { scaleBand } from "d3-scale";
    import type { ScaleBand } from "d3-scale";
    import { DateTime } from "luxon";
    import { LayerCake, Svg } from "layercake";
    import type { LayerCakeContext } from "layercake";
    import { todoistData } from "../../stores/stores";
    import { chartFillClasses } from "../../styles/styleUtils";
    import { chartColumnColors, totalColorClass } from "../../utils/statsChartUtils";
    import StatsDayTooltip from "./StatsDayTooltip.svelte";
    import type { StatsDayRow } from "../../types/stats";

    let { rows }: { rows: StatsDayRow[] } = $props();

    const rowHeight = 14;
    const leftPad = 128;
    const rightPad = 30;
    const colGap = 2;
    const todayIso = DateTime.now().toISODate() ?? "";

    const dailyGoal = $derived($todoistData.user.dailyGoal);

    const chartHeight = $derived(rows.length * rowHeight + 4);
    const yDomain = $derived(rows.map((row) => row.date));

    /** The largest count a single column reached in the window; all bars scale to it. */
    const maxColumnCount = $derived(
        rows.length > 0
            ? Math.max(...rows.flatMap((row) => row.segments.map((segment) => segment.count)))
            : 1,
    );

    /** One chart column per distinct color present in the window. */
    const columnColors = $derived(chartColumnColors(rows));

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
                {@const yScale = k.yScale as ScaleBand<string>}
                {@const colWidth = k.width / columnColors.length}
                <Svg pointerEvents={false}>
                    {#each rows as row (row.date)}
                        {@const isToday = row.date === todayIso}
                        <g
                            class="stats-day"
                            class:stats-day-today={isToday}
                            data-date={row.date}
                            transform={`translate(0, ${yScale(row.date)})`}
                        >
                            {#if isToday}
                                <rect
                                    class="stats-today-band fill-current opacity-10"
                                    height={yScale.bandwidth()}
                                    width={k.width + leftPad + rightPad}
                                    x={-leftPad}
                                />
                            {/if}
                            {#each row.segments as segment (segment.color ?? "unknown")}
                                {@const colIndex = columnColors.indexOf(segment.color)}
                                <rect
                                    class={`stats-segment ${
                                        segment.color
                                            ? chartFillClasses[segment.color]
                                            : "fill-gray-400"
                                    }`}
                                    height={yScale.bandwidth() - 1}
                                    width={(segment.count / maxColumnCount) *
                                        (colWidth - 2 * colGap)}
                                    x={colIndex * colWidth + colGap}
                                />
                            {/each}
                            <text
                                class="stats-day-label fill-current"
                                class:font-bold={isToday}
                                dominant-baseline="middle"
                                text-anchor="end"
                                x={-8}
                                y={yScale.bandwidth() / 2}
                            >
                                {dayLabel(row.date)}
                            </text>
                            <text
                                class={`stats-day-total ${totalColorClass(row.total, dailyGoal)}`}
                                class:font-bold={isToday}
                                dominant-baseline="middle"
                                x={k.width + 4}
                                y={yScale.bandwidth() / 2}
                            >
                                {row.total}
                            </text>
                        </g>
                    {/each}
                </Svg>
            {/snippet}
        </LayerCake>
        <div class="pointer-events-none absolute inset-y-0.5 right-0 left-0">
            {#each rows as row (row.date)}
                <div
                    style:height="{rowHeight}px"
                    class="stats-row tooltip tooltip-bottom pointer-events-auto w-full"
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
