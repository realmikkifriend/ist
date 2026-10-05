<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import type { StatsDayRow } from "../../types/stats";
    import { colorClasses } from "../../styles/styleUtils";

    let { row }: { row: StatsDayRow } = $props();

    /** The row date with its abbreviated weekday, e.g. "Wed 2026-10-01". */
    const dayLabel = $derived(DateTime.fromISO(row.date).toFormat("ccc yyyy-MM-dd"));
</script>

<div
    class="tooltip-content left-1/2 w-80 max-w-[85vw] text-left md:left-0 md:ml-24 md:translate-x-0"
>
    {#if row.entries.length > 0}
        {dayLabel}: {row.entries.length} tasks completed...
        <div class="my-2 space-y-1">
            {#each row.entries as entry (`${entry.taskId}:${entry.time}`)}
                <div class="flex flex-row gap-1">
                    <span class="font-mono tracking-tighter opacity-50">[{entry.time}]</span>
                    {#if entry.contextColor}
                        <div
                            class="mt-1.25 h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {colorClasses[
                                entry.contextColor
                            ].default}"
                        ></div>
                    {/if}
                    {entry.title}
                    {#if entry.temporary}
                        <Icon class="inline-block h-3 w-3 opacity-50" src={ArrowPath} />
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <p>{dayLabel}: No tasks completed this day...</p>
    {/if}
</div>
