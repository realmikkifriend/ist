<script>
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import {
        todoistResources,
        todoistError,
        refreshData,
        userSettings,
        firstDueTask,
    } from "../js/stores";
    import { checkAndUpdateFirstDueTask } from "../js/first";
    import { error } from "../js/toasts";
    import { handleTaskDone, handleTaskDefer } from "../js/taskHandlers";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import Task from "./Task.svelte";

    let resources,
        previousFirstDueTask,
        unsubscribeResources,
        unsubscribeSettings,
        intervalId,
        selectedContextId;

    const setPreviousFirstDueTask = (task) => (previousFirstDueTask = task);

    const updateFirstDueTask = ($resources, $settings) => {
        checkAndUpdateFirstDueTask(
            $resources,
            previousFirstDueTask,
            firstDueTask.set,
            setPreviousFirstDueTask,
            $settings.selectedContextId,
            (newContextId) => {
                userSettings.update((settings) => {
                    return { ...settings, selectedContextId: newContextId };
                });
            },
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

    const handleDone = ({
        detail: {
            task: { id: taskID },
        },
    }) => {
        handleTaskDone(taskID, setPreviousFirstDueTask, firstDueTask.set);
    };

    const handleDefer = ({ detail: { task, time } }) => {
        if (DateTime.isDateTime(time)) {
            handleTaskDefer(task, time, setPreviousFirstDueTask, firstDueTask.set);
        } else {
            error("Received unexpected type of date...");
        }
    };
</script>

<Sidebar {setPreviousFirstDueTask} />

{#if $todoistResources.items}
    {#if $firstDueTask}
        <Task task={$firstDueTask} on:done={handleDone} on:defer={handleDefer} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}
{:else}
    <div class="hero">Loading...</div>
{/if}

{#if $todoistError}
    {@html error(`Error loading Todoist data: ${$todoistError}`) && ""}
{/if}
