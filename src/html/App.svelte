<script>
    import { onMount, onDestroy } from "svelte";
    import {
        todoistResources,
        todoistError,
        refreshData,
        userSettings,
        firstDueTask,
    } from "../js/stores";
    import { checkAndUpdateFirstDueTask } from "../js/first";
    import { error } from "../js/toasts";
    import { handleTaskDone } from "../js/taskHandlers";
    import Sidebar from "./Sidebar.svelte";
    import Task from "./Task.svelte";

    let previousFirstDueTask, unsubscribe, intervalId;
    let selectedContextId;

    const setPreviousFirstDueTask = (task) => (previousFirstDueTask = task);

    onMount(async () => {
        unsubscribe = todoistResources.subscribe(($resources) => {
            checkAndUpdateFirstDueTask(
                $resources,
                previousFirstDueTask,
                firstDueTask.set,
                setPreviousFirstDueTask,
                selectedContextId,
            );
        });

        userSettings.subscribe(($settings) => {
            selectedContextId = $settings.selectedContextId;
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

    const handleTaskDoneWrapper = (event) => {
        handleTaskDone(event, setPreviousFirstDueTask, firstDueTask.set);
    };
</script>

<Sidebar />

{#if $todoistResources.items}
    {#if $firstDueTask}
        <Task task={$firstDueTask} on:done={handleTaskDoneWrapper} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}
{:else}
    <div class="hero">Loading...</div>
{/if}

{#if $todoistError}
    {@html error(`Error loading Todoist data: ${$todoistError}`) && ""}
{/if}
