<script>
    import { XMarkIcon } from "@krowten/svelte-heroicons";
    import { updateFirstDueTask } from "../../js/first";
    import { todoistData, userSettings, firstDueTask, previousFirstDueTask } from "../../js/stores";

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

    function clearSelectedContextId() {
        previousFirstDueTask.set(null);
        userSettings.update((settings) => ({ ...settings, selectedContextId: null }));
    }

    function handleClick() {
        if ($firstDueTask?.summoned) {
            window.location.hash = $firstDueTask.summoned;

            $firstDueTask.summoned = false;
            if ($firstDueTask.skip) {
                // Remove skip property
                delete $firstDueTask.skip;
                // Clear todoistData.reverseTasks
                todoistData.update((data) => ({ ...data, reverseTasks: [] }));
            }

            updateFirstDueTask();
        } else if (selectedContextId) {
            clearSelectedContextId();
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
    on:click={handleClick}
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
