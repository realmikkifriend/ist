<script lang="ts">
    import { getContext } from "svelte";
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { openAgenda } from "../../services/agendaService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import ContextButtonContents from "./ContextButtonContents.svelte";
    import type { MethodsContext } from "../../types/methods";

    let { closeSidebar }: { closeSidebar: () => void } = $props();

    const { handleContextChange } = getContext<MethodsContext>("methods");

    /**
     * A derived store grouping due tasks by context.
     */
    const dueTasksByContext = $derived(getTasksGroupedByContext($todoistData.dueTasks));
</script>

<div class="mb-2 ml-2 flex items-center justify-between">
    <div class="buttons">
        <button
            class="relative"
            onclick={() => {
                openAgenda("today");
                closeSidebar();
            }}
            tabindex="-1"
            type="button"
        >
            <Icon class="h-7 w-8" src={Calendar} />
            <kbd>a</kbd>
        </button>
    </div>
    <h1 class="text-2xl font-bold">Contexts</h1>
    <button
        class="btn drawer-button relative bg-transparent px-0 hover:border-transparent hover:bg-transparent"
        onclick={() => {
            closeSidebar();
        }}
        tabindex="-1"
        type="button"
    >
        <Icon class="h-7 w-8" src={XCircle} />
        <kbd>c</kbd>
    </button>
</div>

<div class="relative w-full">
    {#each $todoistData.contexts as context, index (index)}
        {#if dueTasksByContext[context.id] && dueTasksByContext[context.id].total > 0}
            <button
                class="bg-secondary text-base-100 tooltip sm:tooltip-right tooltip-bottom mb-2 w-full rounded-lg"
                class:opacity-25={$userSettings.selectedContext &&
                    $userSettings.selectedContext.id !== context.id}
                onclick={() => {
                    handleContextChange(context.id);
                    closeSidebar();
                }}
                tabindex={index + 1}
                type="button"
            >
                <ContextButtonContents
                    {context}
                    isDisabled={Boolean(
                        $userSettings.selectedContext &&
                            $userSettings.selectedContext.id !== context.id,
                    )}
                    tasksForContext={dueTasksByContext[context.id]}
                />
            </button>
        {/if}
    {/each}
    <kbd>Tab</kbd>
</div>
