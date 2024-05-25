<script>
    import { Bars3Icon } from "@krowten/svelte-heroicons";
    import { todoistResources } from "../js/stores";
    let resources;

    todoistResources.subscribe(($resources) => {
        resources = $resources;
    });
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
            {#if resources}
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
        </ul>
    </div>
</div>
