<script lang="ts">
    import { Icon, XMark } from "svelte-hero-icons";
    import { userSettings, firstDueTask } from "../../stores/stores";
    import { getDueTaskCountByContext } from "../../services/sidebarService";
    import { clearSelectedTask } from "../../services/firstTaskService";
    import { getContextName } from "../../services/firstTaskService";
</script>

<button
    class="group badge badge-outline items-center whitespace-nowrap
           {$userSettings.selectedContext
        ? 'cursor-pointer'
        : !$firstDueTask?.summoned
          ? 'cursor-default'
          : ''}
           {$userSettings.selectedContext ? 'opacity-75' : 'opacity-40'}
           {$userSettings.selectedContext ? 'text-primary' : ''}
           {$firstDueTask?.summoned ? 'border-purple-400 text-purple-400' : ''}
           {$firstDueTask?.skip ? 'border-yellow-500 text-yellow-500' : ''}"
    on:click={clearSelectedTask}
>
    {#if $firstDueTask?.skip}
        low priority, defer?
    {:else if $firstDueTask?.summoned}
        summoned task
    {:else}
        {getDueTaskCountByContext($firstDueTask?.contextId ?? "")} left in {getContextName()}
    {/if}
    {#if $userSettings.selectedContext || $firstDueTask?.summoned}
        <p class="ml-1 block sm:hidden sm:group-hover:block">
            <Icon src={XMark} class="h-4 w-4" />
        </p>
    {/if}
</button>
