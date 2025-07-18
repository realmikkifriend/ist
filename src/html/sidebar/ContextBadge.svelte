<script>
    import { XMarkIcon } from "@krowten/svelte-heroicons";
    import { handleBadgeClick } from "./sidebar.js";
    import { todoistData, userSettings, firstDueTask } from "../../js/stores";

    let selectedContextId,
        dueTasksInContext = 0,
        currentContextName = "";

    $: selectedContextId = $userSettings.selectedContextId;

    $: {
        filterDueTasksInContext($firstDueTask);
    }

    function filterDueTasksInContext($firstDueTask) {
        if ($todoistData?.dueTasks && $firstDueTask) {
            dueTasksInContext = $todoistData.dueTasks.filter(
                (task) => task.contextId === $firstDueTask.contextId,
            ).length;

            currentContextName =
                $todoistData.contexts.find((c) => c.id === $firstDueTask.contextId)?.name || "";
        }
    }
</script>

<button
    class="group badge badge-outline items-center whitespace-nowrap
           {selectedContextId
        ? 'cursor-pointer'
        : !$firstDueTask?.summoned
          ? 'cursor-default'
          : ''} 
           {selectedContextId ? 'opacity-75' : 'opacity-40'}
           {selectedContextId ? 'text-primary' : ''} 
           {$firstDueTask?.summoned ? 'border-purple-400 text-purple-400' : ''}
           {$firstDueTask?.skip ? 'border-yellow-500 text-yellow-500' : ''}"
    on:click={handleBadgeClick}
>
    {#if $firstDueTask?.skip}
        low priority, defer?
    {:else if $firstDueTask?.summoned}
        summoned task
    {:else}
        {dueTasksInContext} left in {currentContextName}
    {/if}
    {#if selectedContextId || $firstDueTask?.summoned}
        <p class="ml-1 block sm:hidden sm:group-hover:block">
            <XMarkIcon class="h-4 w-4" />
        </p>
    {/if}
</button>
