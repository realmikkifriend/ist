<script lang="ts">
    import { derived } from "svelte/store";
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData, previousFirstDueTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { openAgenda } from "../../services/agendaService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import ContextButtonContents from "./ContextButtonContents.svelte";
    import type { Readable } from "svelte/motion";
    import type { TasksGroupedByContext } from "../../types/todoist";

    /**
     * A derived store grouping due tasks by context.
     */
    const dueTasksByContext: Readable<TasksGroupedByContext> = derived(
        todoistData,
        ($todoistData) => getTasksGroupedByContext($todoistData.dueTasks),
    );

    /**
     * Closes the sidebar drawer by unchecking the drawer checkbox.
     */
    function closeDrawer(): void {
        const drawerCheckbox = document.getElementById("my-drawer") as HTMLInputElement | null;
        if (drawerCheckbox) {
            drawerCheckbox.checked = false;
        }
    }

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
            closeDrawer();
        }
    }
</script>

<div class="mb-2 ml-2 flex items-center justify-between">
    <div class="buttons">
        <button on:click={() => openAgenda("today")}>
            <Icon src={Calendar} class="h-7 w-8" />
        </button>
    </div>
    <h1 class="text-2xl font-bold">Contexts</h1>
    <label
        for="my-drawer"
        class="btn drawer-button bg-transparent px-0 hover:border-transparent hover:bg-transparent"
    >
        <Icon src={XCircle} class="h-7 w-8" />
    </label>
</div>

{#each $todoistData.contexts as context, index (index)}
    {#if $dueTasksByContext[context.id] && $dueTasksByContext[context.id].total > 0}
        <button
            class:opacity-25={$userSettings.selectedContext &&
                $userSettings.selectedContext.id !== context.id}
            class="bg-secondary text-base-100 tooltip sm:tooltip-right tooltip-bottom mb-2 rounded-lg"
            on:click={() => handleContextClick(context.id)}
        >
            <ContextButtonContents {context} tasksForContext={$dueTasksByContext[context.id]} />
        </button>
    {/if}
{/each}
