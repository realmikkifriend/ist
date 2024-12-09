<script>
    import { XMarkIcon } from "@krowten/svelte-heroicons";
    import { updateFirstDueTask } from "../../js/first";
    import {
        todoistResources,
        userSettings,
        firstDueTask,
        previousFirstDueTask,
    } from "../../js/stores";

    let resources,
        selectedContextId,
        dueTasksInContext = 0,
        currentContextName = "";

    $: resources = $todoistResources;

    $: selectedContextId = $userSettings.selectedContextId;

    $: {
        filterDueTasksInContext($firstDueTask);
    }

    function filterDueTasksInContext($firstDueTask) {
        if (resources?.dueTasks && $firstDueTask) {
            dueTasksInContext = resources.dueTasks.filter(
                (task) => task.context_id === $firstDueTask.context_id,
            ).length;

            currentContextName =
                resources.contexts.find((c) => c.id === $firstDueTask.context_id)?.name || "";
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
           {$firstDueTask?.summoned ? 'border-purple-400 text-purple-400' : ''}"
    on:click={handleClick}
>
    {#if $firstDueTask?.summoned}
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
