<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import type { StatsDayRow } from "../../types/stats";

    let { row }: { row: StatsDayRow } = $props();
</script>

<div class="tooltip-content left-1/2 w-80 max-w-[85vw] text-left md:left-0 md:ml-24 md:translate-x-0">
    {#if row.entries.length > 0}
        {row.entries.length} tasks completed...
        <div class="my-2 space-y-1">
            {#each row.entries as entry (`${entry.taskId}:${entry.time}`)}
                <div class="ml-20 -indent-20">
                    <span class="font-mono tracking-tighter opacity-50">[{entry.time}]</span>
                    {entry.title}
                    {#if entry.temporary}
                        <Icon class="inline-block h-3 w-3 opacity-50" src={ArrowPath} />
                    {/if}
                </div>
            {/each}
        </div>
    {:else}
        <p>No tasks completed this day...</p>
    {/if}
</div>
