<script lang="ts">
    import { getContext } from "svelte";
    import { shortcut } from "@svelte-put/shortcut";
    import { Icon, XCircle, Calendar, MagnifyingGlass } from "svelte-hero-icons";
    import { todoistData } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { openAgenda } from "../../services/agendaService";
    import { getTasksGroupedByContext } from "../../utils/filterUtils";
    import { borderClasses } from "../../styles/styleUtils";
    import ContextButtonContents from "./ContextButtonContents.svelte";
    import TaskSearchModal from "../interface/TaskSearchModal.svelte";
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

    let taskSearchTerm = $state("");

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

    /**
     * Opens the task search modal.
     */
    function openTaskSearchModal() {
        taskSearchTerm = "";
        (document.getElementById("task_search_modal") as HTMLDialogElement)?.showModal();
        setTimeout(() => {
            (document.getElementById("task_search_modal_input") as HTMLDialogElement)?.focus();
        }, 100);
    }

    /**
     * Closes the dialog when its backdrop is clicked.
     * @param event The mouse event.
     */
    function closeOnBackdropClick(event: MouseEvent) {
        const dialog = event.currentTarget as HTMLDialogElement;
        if (event.target === dialog) {
            dialog.close();
        }
    }
</script>

<div class="mb-2 ml-2 flex justify-between">
    <h1 class="text-2xl font-bold">Contexts</h1>
    <div class="buttons mt-0.5">
        <button
            class="relative"
            onclick={() => void openTaskSearchModal()}
            tabindex="-1"
            type="button"
        >
            <Icon class="h-6 w-7" src={MagnifyingGlass} />
            <kbd>/</kbd>
        </button>
        <button
            class="relative"
            onclick={() => {
                openAgenda("today");
                closeSidebar();
            }}
            tabindex="-1"
            type="button"
        >
            <Icon class="h-6 w-7" src={Calendar} />
            <kbd>a</kbd>
        </button>
        <button
            class="drawer-button relative -top-0.25 bg-transparent hover:border-transparent hover:bg-transparent"
            onclick={() => {
                closeSidebar();
            }}
            tabindex="-1"
            type="button"
        >
            <Icon class="h-5 w-6" src={XCircle} />
            <kbd>c</kbd>
        </button>
    </div>
</div>

<div
    class="relative w-full"
    onconsider={handleDndConsider}
    onfinalize={handleDndFinalize}
    use:dndzone={{ items: currentContexts, flipDurationMs: 100 }}
>
    {#each currentContexts as context, index (context.id)}
        <button
            class="bg-secondary text-base-100 tooltip sm:tooltip-right tooltip-bottom mb-2 w-full rounded-lg border-l-6 disabled:opacity-25 {borderClasses[
                context.color as ColorName
            ]}"
            disabled={($userSettings.selectedContext &&
                $userSettings.selectedContext.id !== context.id) ||
                !dueTasksByContext[context.id] ||
                dueTasksByContext[context.id].total === 0}
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
                    ($userSettings.selectedContext &&
                        $userSettings.selectedContext.id !== context.id) ||
                        !dueTasksByContext[context.id] ||
                        dueTasksByContext[context.id].total === 0,
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

<dialog
    id="task_search_modal"
    class="modal modal-top justify-center"
    onclick={closeOnBackdropClick}
>
    <TaskSearchModal tasks={$todoistData.tasks} bind:searchTerm={taskSearchTerm} />
</dialog>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "/",
                callback: () => {
                    void openTaskSearchModal();
                },
                modifier: false,
                preventDefault: true,
            },
        ],
    }}
/>
