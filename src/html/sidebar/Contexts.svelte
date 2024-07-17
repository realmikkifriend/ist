<script>
    import { XCircleIcon } from "@krowten/svelte-heroicons";
    import { todoistResources, userSettings, previousFirstDueTask } from "../../js/stores";
    import { getPriorityClasses } from "../../js/priority";

    let resources;
    $: resources = $todoistResources;

    let dueTasksByContext = {};

    $: {
        dueTasksByContext =
            resources.dueTasks?.length > 0
                ? resources.dueTasks.reduce((acc, task) => {
                      const context = acc[task.context_id] || { total: 0, priorities: {} };
                      context.total += 1;
                      context.priorities[task.priority] =
                          (context.priorities[task.priority] || 0) + 1;
                      acc[task.context_id] = context;
                      return acc;
                  }, {})
                : {};
    }

    let settings;
    $: settings = $userSettings;

    function handleCardClick(contextId) {
        previousFirstDueTask.set(null);
        const newContextId = settings.selectedContextId === contextId ? null : contextId;

        userSettings.update((settings) => {
            return {
                ...settings,
                selectedContextId: newContextId,
            };
        });
    }
</script>

<div class="mb-2 ml-2 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Contexts</h1>
    <label
        for="my-drawer"
        class="btn drawer-button bg-transparent px-0 hover:border-transparent hover:bg-transparent"
    >
        <XCircleIcon class="h-7 w-8" />
    </label>
</div>

{#each resources.contexts as context}
    {#if dueTasksByContext[context.id] && dueTasksByContext[context.id].total > 0}
        <button
            class:opacity-25={settings.selectedContextId &&
                settings.selectedContextId !== context.id}
            class="mb-2 rounded-lg bg-secondary text-base-100"
            on:click={() => handleCardClick(context.id)}
        >
            <div class="card-body gap-0 px-2 py-1">
                <p class="card-title text-lg font-bold">{context.name}</p>
                <div class="flex flex-row items-start space-x-2">
                    {#each Object.keys(dueTasksByContext[context.id].priorities).sort((a, b) => b - a) as priority}
                        <div class="flex flex-row items-start space-x-1 py-1">
                            {#each Array(dueTasksByContext[context.id].priorities[priority]).fill() as _}
                                <div
                                    class="badge badge-xs h-1 w-2 border-none p-1 {getPriorityClasses(
                                        priority,
                                    )}"
                                ></div>
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>
        </button>
    {/if}
{/each}
