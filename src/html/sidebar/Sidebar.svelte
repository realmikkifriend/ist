<script>
    import { Bars3Icon, ArrowLeftOnRectangleIcon } from "@krowten/svelte-heroicons";
    import ContextBadge from "./ContextBadge.svelte";
    import Contexts from "./Contexts.svelte";
    import Footer from "../Footer.svelte";
    import {
        todoistAccessToken,
        todoistResources,
        todoistError,
        syncToken,
        userSettings,
        dynalistAccessToken,
        firstDueTask,
    } from "../../js/stores";

    let resources;
    $: resources = $todoistResources;

    let selectedContextId;
    $: selectedContextId = $userSettings.selectedContextId;

    function handleLogout() {
        todoistAccessToken.set("");
        todoistResources.set({});
        todoistError.set(null);
        firstDueTask.set(null);
        syncToken.set("*");
        userSettings.set({ selectedContextId: null });
        dynalistAccessToken.set("");
    }
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-row items-center">
        <label for="my-drawer" class="btn drawer-button mt-0 bg-transparent hover:bg-primary"
            ><Bars3Icon class="h-8 w-8" />
        </label>
        {#if $firstDueTask}
            <ContextBadge />
        {/if}
    </div>
    <div class="drawer-side z-10">
        <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu min-h-full w-80 bg-base-100 p-4 text-base-content">
            {#if resources.contexts}
                <Contexts />
            {/if}

            <li class="mt-auto">
                <Footer />
                <button class="btn btn-secondary w-full" on:click={handleLogout}
                    ><ArrowLeftOnRectangleIcon class="h-6 w-6" />Log Out</button
                >
            </li>
        </ul>
    </div>
</div>
