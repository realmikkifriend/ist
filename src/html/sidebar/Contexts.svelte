<script>
    import { XCircleIcon } from "@krowten/svelte-heroicons";
    import { todoistResources, userSettings } from "../../js/stores";
    export let setPreviousFirstDueTask;

    let resources;

    todoistResources.subscribe(($resources) => {
        resources = $resources;
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
    {#if resources.dueTasks.some((task) => task.context_id === context.id)}
        <button
            class:opacity-25={userSettingsValue.selectedContextId &&
                userSettingsValue.selectedContextId !== context.id}
            class="mb-2 rounded-lg bg-secondary text-base-100"
            on:click={() => handleCardClick(context.id)}
        >
            <div class="card-body p-2 px-3">
                <p class="card-title font-normal">{context.name}</p>
            </div>
        </button>
    {/if}
{/each}
