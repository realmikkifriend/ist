<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData, firstDueTask } from "../stores/stores";
    import { userSettings } from "../stores/interface";
    import { updateFirstDueTask } from "../services/firstTaskService";
    import { refreshData } from "../services/updateService";
    import AppView from "./AppView.svelte";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import Toasts from "./interface/Toasts.svelte";

    const isSpinning = writable(false);
    const hash = writable(window.location.hash);
    let dataPromise: Promise<void> = $state(Promise.resolve());

    $effect(() => {
        if ($userSettings.selectedContext || $todoistData.dueTasks) {
            void updateFirstDueTask();
        }
    });

    /**
     * Sets up hash change listener and periodic refresh on mount.
     * @returns {() => void} Cleanup function to remove interval and event listener.
     */
    onMount(() => {
        /**
         * Updates the hash store with the current window location hash.
         * @returns Current browser location.
         */
        const updateHash = (): void => hash.set(window.location.hash);

        window.addEventListener("hashchange", updateHash);

        updateHash();

        void handleRefresh();

        const interval = setInterval(() => {
            void handleRefresh();
        }, 300000);

        return () => {
            clearInterval(interval);
            window.removeEventListener("hashchange", updateHash);
        };
    });

    /**
     * Refreshes Todoist data and manages the spinning state.
     * @returns Promise that resolves when data is refreshed and spinning state is updated.
     */
    const handleRefresh = async (): Promise<void> => {
        isSpinning.set(true);
        await refreshData();
        isSpinning.set(false);
    };

    // Initialize dataPromise on component creation
    if ($firstDueTask?.summoned) {
        dataPromise = Promise.resolve();
    } else {
        dataPromise = handleRefresh();
    }
</script>

<div class="flex w-fit items-center">
    <Sidebar hash={$hash} />

    {#if $firstDueTask && $hash !== "#today" && $hash !== "#tomorrow"}
        {#key $firstDueTask.id}
            <ContextBadge />
        {/key}
    {/if}
</div>

{#if $hash === "#today" || $hash === "#tomorrow"}
    <Agenda />
{:else}
    <AppView {dataPromise} />
{/if}

<div class="fixed right-2 bottom-2 z-10">
    <button class="bg-base-100 rounded-md p-1" onclick={handleRefresh}>
        <Icon src={ArrowPath} class="h-6 w-6 {$isSpinning ? 'animate-spin cursor-wait' : ''}" />
    </button>
</div>

<Toasts />
