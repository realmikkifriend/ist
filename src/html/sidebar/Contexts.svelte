<script lang="ts">
    import { derived } from "svelte/store";
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData, userSettings, previousFirstDueTask } from "../../stores/stores";
    import { getPriorityClasses } from "../../utils/styleUtils";
    import { openAgenda } from "../../services/agendaService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import type { Readable } from "svelte/motion";
    import type { TasksGroupedByContext, Priority } from "../../types/todoist";

    /**
     * Returns the CSS class for a given priority.
     * Necessary because Svelte 4 templates can't include type assertions.
     * @param priorityNum - The given priority.
     * @returns The Tailwind classes that correspond to the priority.
     */
    function getPriorityBadgeClass(priorityNum: number): string {
        // Priority is a number enum, so coerce to Priority
        return getPriorityClasses(priorityNum as Priority);
    }

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
            <div class="tooltip-content w-70 text-left">
                {$dueTasksByContext[context.id].total} tasks due in this context:
                <div class="my-2 space-y-1">
                    {#each $dueTasksByContext[context.id].tasks as task (task.id)}
                        <span class="flex flex-row">
                            <div
                                class="mt-1.5 mr-1 h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {getPriorityBadgeClass(
                                    task.priority,
                                )}"
                            ></div>
                            {task.content}
                        </span>
                    {/each}
                </div>
            </div>

            <div class="gap-0 px-2 py-1">
                <p class="cursor-pointer text-left text-lg font-bold">{context.name}</p>
                <div class="flex flex-row items-start space-x-2">
                    {#each Object.keys($dueTasksByContext[context.id].priorities).sort((a, b) => +b - +a) as priorityStr, index (index)}
                        <div class="flex flex-row items-start space-x-1 py-1">
                            {#each Array.from( { length: $dueTasksByContext[context.id].priorities[+priorityStr] }, ) as _, badgeIndex (badgeIndex)}
                                <div
                                    class="h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {getPriorityBadgeClass(
                                        +priorityStr,
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
