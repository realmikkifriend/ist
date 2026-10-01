<script lang="ts">
    import { scaleBand } from "d3-scale";
    import type { ScaleBand, ScaleLinear } from "d3-scale";
    import { LayerCake, Svg } from "layercake";
    import type { LayerCakeContext } from "layercake";
    import { chartFillClasses } from "../../styles/styleUtils";
    import type { StatsDayRow } from "../../types/stats";

    let { rows }: { rows: StatsDayRow[] } = $props();

    const rowHeight = 18;

    const maxTotal = $derived(rows.length > 0 ? Math.max(...rows.map((row) => row.total)) : 1);
    const chartHeight = $derived(rows.length * rowHeight + 4);
    const yDomain = $derived(rows.map((row) => row.date));
</script>

{#if rows.length === 0}
    <p class="text-center text-sm opacity-60">No completions in this window yet.</p>
{:else}
    <div style:height="{chartHeight}px" class="w-full">
        <LayerCake
            data={rows}
            padding={{ bottom: 2, left: 76, right: 30, top: 2 }}
            x={(d: StatsDayRow) => d.total}
            xDomain={[0, maxTotal]}
            xNice={false}
            y={(d: StatsDayRow) => d.date}
            {yDomain}
            yScale={scaleBand()}
        >
            {#snippet children(k: LayerCakeContext)}
                {@const xScale = k.xScale as ScaleLinear<number, number>}
                {@const yScale = k.yScale as ScaleBand<string>}
                <Svg pointerEvents={false}>
                    {#each rows as row (row.date)}
                        <g
                            class="stats-day"
                            data-date={row.date}
                            transform={`translate(0, ${yScale(row.date)})`}
                        >
                            {#each row.segments as segment (segment.contextId)}
                                <rect
                                    class={`stats-segment ${
                                        segment.color
                                            ? chartFillClasses[segment.color]
                                            : "fill-gray-400"
                                    }`}
                                    height={yScale.bandwidth()}
                                    width={xScale(segment.end) - xScale(segment.start)}
                                    x={xScale(segment.start)}
                                />
                            {/each}
                            <text
                                class="stats-day-label"
                                dominant-baseline="middle"
                                text-anchor="end"
                                x={-8}
                                y={yScale.bandwidth() / 2}
                            >
                                {row.date}
                            </text>
                            <text
                                class="stats-day-total"
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
    </div>
{/if}
