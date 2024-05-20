<script>
    import { onMount } from "svelte";
    import Task from "./Task.svelte";
    import { fetchTodoistData } from "../js/api";
    export let todoistAccessToken;

    const resourceTypes = ["items", "projects", "notes"];
    let resources = {};
    let error = null;

    onMount(async () => {
        try {
            const data = await fetchTodoistData(todoistAccessToken, resourceTypes);
            resources = data.resources;
            error = data.error;
        } catch (err) {
            error = err.message;
        }
    });
</script>

{#if Object.keys(resources).length > 0}
    {#if resources["dueTasks"]}
        {#each resources["dueTasks"] as task}
            <Task {task} />
        {/each}
    {:else}
        <p>No due tasks</p>
    {/if}
{:else if error}
    <p>Error: {error}</p>
{:else}
    Loading...
{/if}
