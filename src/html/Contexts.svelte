<script>
    import { todoistResources, userSettings } from "../js/stores";

    let resources;

    todoistResources.subscribe(($resources) => {
        resources = $resources;
    });

    let userSettingsValue;
    userSettings.subscribe(($settings) => {
        userSettingsValue = $settings;
    });

    function handleCardClick(contextId) {
        userSettings.update((settings) => {
            return {
                ...settings,
                selectedContextId: settings.selectedContextId === contextId ? null : contextId,
            };
        });
    }
</script>

<h1 class="ml-2 pb-4 text-2xl">Contexts</h1>

{#each resources.contexts as context}
    {#if resources.dueTasks.some((task) => task.context_id === context.id)}
        <button
            class:opacity-25={userSettingsValue.selectedContextId &&
                userSettingsValue.selectedContextId !== context.id}
            class="mb-2 rounded-lg border-2"
            on:click={() => handleCardClick(context.id)}
        >
            <div class="card-body p-2 px-3">
                <strong class="card-title">{context.name}</strong>
            </div>
        </button>
    {/if}
{/each}
