<script>
    import { XCircleIcon, CalendarIcon, ArrowsUpDownIcon } from "@krowten/svelte-heroicons";
    import { todoistData, userSettings, previousFirstDueTask } from "../../js/stores";
    import { getPriorityClasses } from "../../js/classes";
    import { openAgenda } from "../agenda/agenda";
    // import ContextReorderModal from "./ContextReorderModal.svelte";

    let dueTasksByContext = {};

    $: {
        dueTasksByContext =
            $todoistData.dueTasks?.length > 0
                ? $todoistData.dueTasks.reduce((acc, task) => {
                      const context = acc[task.contextId] || { total: 0, priorities: {} };
                      context.total += 1;
                      context.priorities[task.priority] =
                          (context.priorities[task.priority] || 0) + 1;
                      acc[task.contextId] = context;
                      return acc;
                  }, {})
                : {};
    }

    let settings;
    $: settings = $userSettings;

    let modal;
    let modalOpen = false;

    function closeDrawer() {
        const drawerCheckbox = document.getElementById("my-drawer");
        if (drawerCheckbox) {
            drawerCheckbox.checked = false;
        }
    }

    function handleContextClick(contextId) {
        previousFirstDueTask.set(null);
        const newContextId = settings.selectedContextId === contextId ? null : contextId;

        userSettings.update((settings) => ({
            ...settings,
            selectedContextId: newContextId,
        }));

        if (newContextId !== null) {
            closeDrawer();
        }
    }

    function openModal() {
        modal.showModal();
        modalOpen = true;
    }

    function closeModal() {
        modal.close();
        modalOpen = false;
    }
</script>

<div class="mb-2 ml-2 flex items-center justify-between">
    <div class="buttons">
        <button on:click={() => openAgenda("today")}>
            <CalendarIcon class="h-7 w-8" />
        </button>
        <!-- <button on:click={openModal}>
            <ArrowsUpDownIcon class="h-7 w-8" />
        </button> -->
    </div>
    <h1 class="text-2xl font-bold">Contexts</h1>
    <label
        for="my-drawer"
        class="btn drawer-button bg-transparent px-0 hover:border-transparent hover:bg-transparent"
    >
        <XCircleIcon class="h-7 w-8" />
    </label>
</div>

{#each $todoistData.contexts as context}
    {#if dueTasksByContext[context.id] && dueTasksByContext[context.id].total > 0}
        <button
            class:opacity-25={settings.selectedContextId &&
                settings.selectedContextId !== context.id}
            class="mb-2 rounded-lg bg-secondary text-base-100"
            on:click={() => handleContextClick(context.id)}
        >
            <div class="card-body gap-0 px-2 py-1">
                <p class="card-title text-lg font-bold">{context.name}</p>
                <div class="flex flex-row items-start space-x-2">
                    {#each Object.keys(dueTasksByContext[context.id].priorities).sort((a, b) => b - a) as priority}
                        <div class="flex flex-row items-start space-x-1 py-1">
                            {#each Array(dueTasksByContext[context.id].priorities[priority]).fill() as _}
                                <div
                                    class="badge badge-xs h-1 w-2 border-none p-1 {getPriorityClasses(
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

<!-- <dialog id="reorder_modal" class="modal" bind:this={modal} on:close={closeModal}>
    <ContextReorderModal {modalOpen} />
</dialog> -->
