<script>
    import { onMount, onDestroy } from "svelte";
    import { todoistResources, todoistError, refreshData } from "../js/stores";
    import Task from "./Task.svelte";
    let firstDueTask, unsubscribe, intervalId;

    onMount(async () => {
        unsubscribe = todoistResources.subscribe(($resources) => {
            if ($resources.dueTasks && $resources.dueTasks.length > 0) {
                firstDueTask = $resources.dueTasks[0];
            }
        });

        await refreshData();

        intervalId = setInterval(async () => {
            await refreshData();
        }, 300000);
    });

    onDestroy(() => {
        clearInterval(intervalId);
        unsubscribe();
    });
</script>

{#if $todoistResources.items}
    {#if firstDueTask}
        <Task task={firstDueTask} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}
{:else if $todoistError}
    <div class="hero">Error: {$todoistError}</div>
{:else}
    <div class="hero">Loading...</div>
{/if}
