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

    let previousFirstDueTask, unsubscribeResources, unsubscribeSettings, intervalId;
    let selectedContextId;
    let resources;

    const setPreviousFirstDueTask = (task) => (previousFirstDueTask = task);

    const updateFirstDueTask = ($resources, $settings) => {
        checkAndUpdateFirstDueTask(
            $resources,
            previousFirstDueTask,
            firstDueTask.set,
            setPreviousFirstDueTask,
            $settings.selectedContextId,
        );
    };

    onMount(async () => {
        unsubscribeResources = todoistResources.subscribe(($resources) => {
            resources = $resources;
            updateFirstDueTask($resources, { selectedContextId });
        });

        unsubscribeSettings = userSettings.subscribe(($settings) => {
            selectedContextId = $settings.selectedContextId;
            updateFirstDueTask(resources, $settings);
        });

        await refreshData();

        intervalId = setInterval(async () => {
            await refreshData();
        }, 300000);
    });

    onDestroy(() => {
        clearInterval(intervalId);
        unsubscribeResources();
        unsubscribeSettings();
    });

    const handleTaskDoneWrapper = (event) => {
        handleTaskDone(event, setPreviousFirstDueTask, firstDueTask.set);
    };
</script>

<Sidebar {setPreviousFirstDueTask} />

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
