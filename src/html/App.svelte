<script>
    import { onMount } from "svelte";
    import { todoistAccessToken } from "../js/stores";
    import Task from "./Task.svelte";
    import { fetchTodoistData } from "../js/api";
    const resourceTypes = ["items", "projects", "notes"];
    let resources = {};
    let error = null;

    onMount(async () => {
        if ($todoistAccessToken) {
            try {
                const data = await fetchTodoistData($todoistAccessToken, resourceTypes);
                resources = data.resources;
                error = data.error;
            } catch (err) {
                error = err.message;
            }
        } else {
            error = "No access token found.";
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
