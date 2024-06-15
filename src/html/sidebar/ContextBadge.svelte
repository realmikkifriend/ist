<script>
    import { XMarkIcon } from "@krowten/svelte-heroicons";
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
</script>

<button
    class="group badge badge-outline items-center whitespace-nowrap"
    class:text-primary={selectedContextId}
    class:opacity-30={!selectedContextId}
    class:opacity-75={selectedContextId}
    class:cursor-default={!selectedContextId}
    class:cursor-pointer={selectedContextId}
    on:click={() => selectedContextId && clearSelectedContextId()}
>
    {dueTasksInContext} left in {currentContextName}
    {#if selectedContextId}
        <p class="ml-1 block sm:hidden sm:group-hover:block">
            <XMarkIcon class="h-4 w-4" />
        </p>
    {/if}
</button>
