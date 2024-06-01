<script>
    import { Bars3Icon, ArrowLeftOnRectangleIcon } from "@krowten/svelte-heroicons";
    import Contexts from "./Contexts.svelte";
    import Footer from "./Footer.svelte";
    import {
        todoistAccessToken,
        todoistResources,
        todoistError,
        syncToken,
        userSettings,
        firstDueTask,
    } from "../js/stores";

    let resources;
    let dueTasksInContext = 0;
    let currentContextName = "";

    todoistResources.subscribe(($resources) => {
        resources = $resources;
        filterDueTasksInContext();
    });

    firstDueTask.subscribe(($firstDueTask) => {
        filterDueTasksInContext();
    });

    function filterDueTasksInContext() {
        if (resources && resources.dueTasks && firstDueTask) {
            let $firstDueTask;
            firstDueTask.subscribe((value) => {
                $firstDueTask = value;
            })();
            dueTasksInContext = resources.dueTasks.filter(
                (task) => task.context_id === $firstDueTask.context_id,
            ).length;

            const context = resources.contexts.find((c) => c.id === $firstDueTask.context_id);
            currentContextName = context ? context.name : "";
        }
    }

    function handleLogout() {
        todoistAccessToken.set("");
        todoistResources.set({});
        todoistError.set(null);
        syncToken.set("*");
        userSettings.set({ selectedContextId: null });
    }
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-row items-center">
        <label for="my-drawer" class="btn drawer-button mt-0 bg-transparent hover:bg-primary"
            ><Bars3Icon class="h-8 w-8" />
        </label>
        {#if $firstDueTask}
            <div class="badge badge-outline whitespace-nowrap opacity-75">
                {dueTasksInContext} left in {currentContextName}
            </div>
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
