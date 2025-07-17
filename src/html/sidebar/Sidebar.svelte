<script>
    import { Bars3Icon, ArrowLeftOnRectangleIcon } from "@krowten/svelte-heroicons";
    import { toast } from "@zerodevx/svelte-toast";
    import Contexts from "./Contexts.svelte";
    import Footer from "../Footer.svelte";
    import {
        todoistAccessToken,
        todoistResources,
        todoistData,
        todoistError,
        syncToken,
        userSettings,
        dynalistAccessToken,
        firstDueTask,
    } from "../../js/stores";

    export let hash;

    let selectedContextId;
    $: selectedContextId = $userSettings.selectedContextId;

    function handleLogout() {
        toast.pop(0);
        todoistAccessToken.set("");
        todoistResources.set({});
        todoistData.set({});
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
        <label for="my-drawer" class="btn drawer-button mt-0 bg-transparent hover:bg-primary">
            {#if hash !== "#today" && hash !== "#tomorrow"}
                <Bars3Icon class="h-8 w-8" />
            {/if}
        </label>
    </div>
    <div class="drawer-side z-30">
        <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu min-h-full w-80 bg-base-100 px-4 py-2 text-base-content">
            {#if $todoistData.contexts}
                <Contexts />
            {/if}

            <div class="mt-auto">
                <Footer />
                <button class="btn btn-secondary w-full" on:click={handleLogout}
                    ><ArrowLeftOnRectangleIcon class="h-6 w-6" />Log Out</button
                >
            </div>
        </ul>
    </div>
</div>
