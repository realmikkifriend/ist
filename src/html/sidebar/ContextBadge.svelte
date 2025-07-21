<script>
    import { Icon, XMark } from "svelte-hero-icons";
    import { handleBadgeClick, getDueTaskCountByContext } from "./sidebar.js";
    import { todoistData, userSettings, firstDueTask } from "../../js/stores";

    function getContextName() {
        if ($userSettings?.selectedContext?.name) {
            return $userSettings.selectedContext.name;
        }
        if ($todoistData?.contexts) {
            const context = $todoistData.contexts.find((c) => c.id === $firstDueTask.contextId);
            if (context) return context.name;
        }
        return "";
    }
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
    on:click={handleBadgeClick}
>
    {#if $firstDueTask?.skip}
        low priority, defer?
    {:else if $firstDueTask?.summoned}
        summoned task
    {:else}
        {getDueTaskCountByContext($firstDueTask?.contextId)} left in {getContextName()}
    {/if}
    {#if $userSettings.selectedContext || $firstDueTask?.summoned}
        <p class="ml-1 block sm:hidden sm:group-hover:block">
            <Icon src={XMark} class="h-4 w-4" />
        </p>
    {/if}
</button>
