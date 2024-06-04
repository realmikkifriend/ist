<script>
    import { XMarkIcon } from "@krowten/svelte-heroicons";
    import { todoistResources, userSettings, firstDueTask } from "../../js/stores";
    export let setPreviousFirstDueTask;

    let resources,
        dueTasksInContext = 0,
        currentContextName = "",
        selectedContextId;
    todoistResources.subscribe(($resources) => {
        resources = $resources;
    });

    firstDueTask.subscribe(() => {
        filterDueTasksInContext();
    });

    userSettings.subscribe(($settings) => {
        selectedContextId = $settings.selectedContextId;
    });

    function filterDueTasksInContext() {
        if (resources?.dueTasks && firstDueTask) {
            let $firstDueTask;
            firstDueTask.subscribe((value) => ($firstDueTask = value))();

            dueTasksInContext = resources.dueTasks.filter(
                (task) => task.context_id === $firstDueTask.context_id,
            ).length;

            currentContextName =
                resources.contexts.find((c) => c.id === $firstDueTask.context_id)?.name || "";
        }
    }

    function clearSelectedContextId() {
        setPreviousFirstDueTask(null);
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
    on:click={clearSelectedContextId}
>
    {dueTasksInContext} left in {currentContextName}
    {#if selectedContextId}
        <p class="ml-1 hidden group-hover:block">
            <XMarkIcon class="h-4 w-4" />
        </p>
    {/if}
</button>
