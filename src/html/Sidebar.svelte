<script>
    import { Bars3Icon, ArrowLeftOnRectangleIcon } from "@krowten/svelte-heroicons";
    import { todoistAccessToken, todoistResources, todoistError, syncToken } from "../js/stores";

    let resources;

    todoistResources.subscribe(($resources) => {
        resources = $resources;
    });

    function handleLogout() {
        todoistAccessToken.set("");
        todoistResources.set({});
        todoistError.set(null);
        syncToken.set("*");
    }
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
        <label for="my-drawer" class="btn btn-primary drawer-button absolute mt-0"
            ><Bars3Icon class="h-5 w-5" /></label
        >
    </div>
    <div class="drawer-side">
        <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu min-h-full w-80 bg-base-200 p-4 text-base-content">
            {#if resources.contexts}
                <h1 class="ml-2 pb-2 text-2xl">Contexts</h1>

                {#each resources.contexts as context}
                    {#if resources.dueTasks.some((task) => task.context_id === context.id)}
                        <div class="card mb-2 border-2">
                            <div class="card-body p-2 px-3">
                                <strong class="card-title">{context.name}</strong>
                            </div>
                        </div>
                    {/if}
                {/each}
            {/if}

            <li class="mt-auto">
                <button class="btn btn-secondary w-full" on:click={handleLogout}
                    ><ArrowLeftOnRectangleIcon class="h-6 w-6" />Log Out</button
                >
            </li>
        </ul>
    </div>
</div>
