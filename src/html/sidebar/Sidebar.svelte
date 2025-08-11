<script lang="ts">
    import { Icon, Bars3, ArrowLeftOnRectangle } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import Contexts from "./Contexts.svelte";
    import DailyGoal from "../activity/DailyGoal.svelte";
    import Footer from "../interface/Footer.svelte";
    import { resetAllStores } from "../../stores/reset";
    import { todoistData } from "../../stores/stores";
    import type { HashProp } from "../../types/interface";

    let { hash }: HashProp = $props();
    let isSidebarOpen = $state(false);

    /**
     * Closes the sidebar.
     */
    function closeSidebar(): void {
        isSidebarOpen = false;
    }
</script>

<div class="drawer">
    <input
        id="sidebar-toggle"
        class="drawer-toggle"
        tabindex="-1"
        type="checkbox"
        bind:checked={isSidebarOpen}
    />

    <div
        class="drawer-content flex flex-row items-center"
        class:invisible={isSidebarOpen || hash === "#today" || hash === "#tomorrow"}
        class:pointer-events-none={isSidebarOpen || hash === "#today" || hash === "#tomorrow"}
    >
        <button
            class="btn drawer-button hover:bg-primary relative mt-0 w-12 bg-transparent p-0 shadow-none"
            onclick={() => (isSidebarOpen = true)}
            tabindex={isSidebarOpen || hash === "#today" || hash === "#tomorrow" ? -1 : undefined}
            type="button"
        >
            <Icon class="h-8 w-8" src={Bars3} />
            <kbd>c</kbd>
        </button>
    </div>
    <div class="drawer-side z-30">
        <label class="drawer-overlay" aria-label="close sidebar" for="sidebar-toggle"></label>
        <ul class="menu bg-base-100 text-base-content min-h-full w-80 px-4 py-2">
            {#if $todoistData.contexts}
                <Contexts onDismiss={closeSidebar} />
            {/if}

            <div class="mt-auto">
                <div class="bg-neutral mb-4 flex w-full flex-row items-center rounded-sm p-2">
                    <DailyGoal />
                </div>
                <Footer />
                <button class="btn btn-secondary w-full" onclick={resetAllStores} type="button">
                    <Icon class="h-6 w-6" src={ArrowLeftOnRectangle} />Log Out
                </button>
            </div>
        </ul>
    </div>
</div>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "c",
                callback: () => {
                    isSidebarOpen = !isSidebarOpen;
                },
                modifier: false,
            },
            {
                key: "c",
                callback: () => closeSidebar(),
                modifier: [["ctrl", "shift"]],
            },
        ],
    }}
/>
