<script lang="ts">
    import { getContext } from "svelte";
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import { todoistData } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { openAgenda } from "../../services/agendaService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import { borderClasses } from "../../styles/styleUtils";
    import ContextButtonContents from "./ContextButtonContents.svelte";
    import type { HandlerMethodsContext } from "../../types/methods";
    import type { ColorName, Context } from "../../types/todoist";
    import { dndzone, type DndEvent } from "svelte-dnd-action";
    import { reorderContexts } from "../../services/apiService";
    import { success } from "../../services/toastService";

    let { closeSidebar }: { closeSidebar: () => void } = $props();

    const { handleContextChange, updateDisplayedTask } =
        getContext<HandlerMethodsContext>("handlerMethods");

    /**
     * A derived store grouping due tasks by context.
     */
    const dueTasksByContext = $derived(getTasksGroupedByContext($todoistData.dueTasks));

    let currentContexts: Context[] = $derived(
        $todoistData.contexts.filter((context) => !context.inboxProject),
    );

    /**
     * Updates local store of contexts order.
     * @param e The event containing the list of contexts.
     */
    function handleDndConsider(e: CustomEvent<DndEvent<Context>>) {
        const { items } = e.detail;
        currentContexts = items;
    }

    /**
     * Updates all stores with new contexts order.
     * @param e The event containing the list of contexts.
     */
    async function handleDndFinalize(e: CustomEvent<DndEvent<Context>>) {
        const { items } = e.detail;
        currentContexts = items;
        todoistData.update((data) => ({ ...data, contexts: items }));
        await reorderContexts(items);
        success("Contexts reordered successfully!");
        await updateDisplayedTask();
    }
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

<div
    class="relative w-full"
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    use:dndzone={{ items: currentContexts, flipDurationMs: 100 }}
>
    {#each currentContexts as context, index (context.id)}
        <button
            class="bg-secondary text-base-100 tooltip sm:tooltip-right tooltip-bottom mb-2 w-full rounded-lg border-l-6 {borderClasses[
                context.color as ColorName
            ]}"
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
                tasksForContext={dueTasksByContext[context.id] || {
                    total: 0,
                    priorities: {},
                    tasks: [],
                }}
            />
        </button>
    {/each}
    <kbd>Tab</kbd>
</div>
