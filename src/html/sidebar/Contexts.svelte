<script lang="ts">
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData, previousFirstDueTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { openAgenda } from "../../services/agendaService";
    import { closeSidebar } from "../../services/sidebarService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import ContextButtonContents from "./ContextButtonContents.svelte";

    /**
     * A derived store grouping due tasks by context.
     */
    const dueTasksByContext = $derived(getTasksGroupedByContext($todoistData.dueTasks));

    /**
     * Handles clicking on a context button.
     * Updates the selected context in user settings and closes the drawer if a new context is selected.
     * @param contextId - The ID of the context that was clicked.
     */
    function handleContextClick(contextId: string): void {
        previousFirstDueTask.set(null);
        const isCurrentlySelected = $userSettings.selectedContext?.id === contextId;
        const newSelectedContext = isCurrentlySelected
            ? null
            : {
                  id: contextId,
                  name: $todoistData.contexts.find((c) => c.id === contextId)?.name || "",
              };

        userSettings.update((settings) => ({
            ...settings,
            selectedContext: newSelectedContext,
        }));

        if (newSelectedContext !== null) {
            closeSidebar();
        }
    }
</script>

<div class="mb-2 ml-2 flex items-center justify-between">
    <div class="buttons">
        <button class="relative" onclick={() => openAgenda("today")} type="button">
            <Icon class="h-7 w-8" src={Calendar} />
        </button>
    </div>
    <h1 class="text-2xl font-bold">Contexts</h1>
    <label
        class="btn drawer-button bg-transparent px-0 hover:border-transparent hover:bg-transparent"
        for="my-drawer"
    >
        <Icon class="h-7 w-8" src={XCircle} />
    </label>
</div>

{#each $todoistData.contexts as context, index (index)}
    {#if dueTasksByContext[context.id] && dueTasksByContext[context.id].total > 0}
        <button
            class="bg-secondary text-base-100 tooltip sm:tooltip-right tooltip-bottom mb-2 rounded-lg"
            class:opacity-25={$userSettings.selectedContext &&
                $userSettings.selectedContext.id !== context.id}
            onclick={() => handleContextClick(context.id)}
            type="button"
        >
            <ContextButtonContents {context} tasksForContext={dueTasksByContext[context.id]} />
        </button>
    {/if}
{/each}
