<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import type { StatsDayRow } from "../../types/stats";

    let { row }: { row: StatsDayRow } = $props();
</script>

<div class="tooltip-content left-0 ml-24 w-80 translate-x-0 text-left">
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
