<script>
    import { XCircleIcon } from "@krowten/svelte-heroicons";
    import { todoistResources, userSettings } from "../../js/stores";
    import { getPriorityClass } from "../../js/priority";
    export let setPreviousFirstDueTask;

    let resources;
    let dueTasksByContext = {};

    todoistResources.subscribe(($resources) => {
        resources = $resources;

        if (resources.dueTasks?.length > 0) {
            dueTasksByContext = resources.dueTasks.reduce((acc, task) => {
                if (!acc[task.context_id]) {
                    acc[task.context_id] = { total: 0, priorities: {} };
                }
                acc[task.context_id].total += 1;

                if (!acc[task.context_id].priorities[task.priority]) {
                    acc[task.context_id].priorities[task.priority] = 0;
                }
                acc[task.context_id].priorities[task.priority] += 1;

                return acc;
            }, {});
        }
    });

    let userSettingsValue;
    userSettings.subscribe(($settings) => {
        userSettingsValue = $settings;
    });

    function handleCardClick(contextId) {
        setPreviousFirstDueTask(null);
        const newContextId = userSettingsValue.selectedContextId === contextId ? null : contextId;

        userSettings.update((settings) => {
            return {
                ...settings,
                selectedContextId: newContextId,
            };
        });
    }
</script>

<div class="mb-3 ml-2 flex items-center justify-between">
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
            class:opacity-25={userSettingsValue.selectedContextId &&
                userSettingsValue.selectedContextId !== context.id}
            class="mb-2 rounded-lg bg-secondary text-base-100"
            on:click={() => handleCardClick(context.id)}
        >
            <div class="card-body gap-0.5 p-2 px-3">
                <p class="card-title font-normal">{context.name}</p>
                <div class="flex flex-row space-x-2">
                    {#each Object.keys(dueTasksByContext[context.id].priorities).sort((a, b) => b - a) as priority}
                        <div class="space-x-1">
                            {#each Array(dueTasksByContext[context.id].priorities[priority]).fill() as _}
                                <div
                                    class="badge badge-xs w-3 border-none {getPriorityClass(
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
