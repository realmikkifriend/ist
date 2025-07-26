<script lang="ts">
    import { derived } from "svelte/store";
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData, userSettings, previousFirstDueTask } from "../../js/stores";
    import { getPriorityClasses } from "../../js/classes";

    /**
     * Returns the CSS class for a given priority string.
     * This moves the type assertion logic out of the template and into the script section.
     * @param priorityStr - The given priority.
     * @returns The Tailwind classes that correspond to the priority.
     */
    function getPriorityBadgeClass(priorityStr: string): string {
        // Priority is a number enum, so coerce to number and cast to Priority
        return getPriorityClasses(+priorityStr as Priority);
    }
    import { openAgenda } from "../agenda/agenda";
    import { getDueTasksGroupedByContext } from "./sidebar";
    import type { Readable } from "svelte/motion";
    import type { DueTasksGroupedByContext, Priority } from "../../../types/todoist";

    /**
     * A derived store grouping due tasks by context.
     */
    const dueTasksByContext: Readable<DueTasksGroupedByContext> = derived(
        todoistData,
        ($todoistData) => ($todoistData ? getDueTasksGroupedByContext() : {}),
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
            class="mb-2 rounded-lg bg-secondary text-base-100"
            on:click={() => handleContextClick(context.id)}
        >
            <div class="card-body gap-0 px-2 py-1">
                <p class="card-title text-lg font-bold">{context.name}</p>
                <div class="flex flex-row items-start space-x-2">
                    {#each Object.keys($dueTasksByContext[context.id].priorities).sort((a, b) => +b - +a) as priorityStr, index (index)}
                        <div class="flex flex-row items-start space-x-1 py-1">
                            {#each Array.from( { length: $dueTasksByContext[context.id].priorities[+priorityStr] }, ) as _, badgeIndex (badgeIndex)}
                                <div
                                    class="badge badge-xs h-1 w-2 border-none p-1 {getPriorityBadgeClass(
                                        priorityStr,
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
