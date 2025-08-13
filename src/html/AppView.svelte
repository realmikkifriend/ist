<script lang="ts">
    import { shortcut } from "@svelte-put/shortcut";
    import { todoistData, todoistError, firstDueTask } from "../stores/stores";
    import { error as showError } from "../services/toastService";
    import NoTasks from "./NoTasks.svelte";
    import TaskDisplay from "./task/TaskDisplay.svelte";
    import type { PromiseProp } from "../types/interface";

    let { dataPromise, updateDisplayedTask }: PromiseProp = $props();
</script>

{#await dataPromise}
    <div class="hero">Loading...</div>
{:then}
    {#if $todoistData.tasks}
        {#if $firstDueTask}
            {#key $firstDueTask.id}
                <TaskDisplay task={$firstDueTask} {updateDisplayedTask} />
            {/key}
        {:else}
            <NoTasks />
        {/if}
    {:else}
        <div class="hero">No tasks, try adding some</div>
    {/if}
{:catch error}
    <div class="hero">Error loading Todoist data: {error.message}</div>
{/await}

{#if $todoistError}
    {showError($todoistError)}
{/if}

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "?",
                callback: () => {
                    document.body.classList.toggle("show-kbd");
                },
                modifier: "shift",
            },
        ],
    }}
/>
