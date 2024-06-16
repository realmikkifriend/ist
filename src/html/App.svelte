<script>
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { todoistResources, todoistError, userSettings, firstDueTask } from "../js/stores";
    import { checkAndUpdateFirstDueTask } from "../js/first";
    import { refreshData } from "../js/api";
    import { error } from "../js/toasts";
    import { handleTaskDone, handleTaskDefer } from "../js/taskHandlers";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import Task from "./task/Task.svelte";

    let intervalId,
        isSpinning = false;

    $: selectedContextId = $userSettings.selectedContextId;
    $: updateFirstDueTask($todoistResources, { selectedContextId });

    onMount(async () => {
        await handleRefresh();

        intervalId = setInterval(async () => {
            await handleRefresh();
        }, 300000);
    });

    onDestroy(() => {
        clearInterval(intervalId);
    });

    const updateFirstDueTask = ($resources, $settings) => {
        checkAndUpdateFirstDueTask($resources, $settings.selectedContextId, (newContextId) => {
            userSettings.update((settings) => {
                return { ...settings, selectedContextId: newContextId };
            });
        });
    };

    const handleDone = ({
        detail: {
            task: { id: taskID },
        },
    }) => {
        handleTaskDone(taskID);
    };

    const handleDefer = ({ detail: { task, time } }) => {
        if (DateTime.isDateTime(time)) {
            handleTaskDefer([[task, time]]);
        } else {
            error("Received unexpected type of date...");
        }
    };

    const handleRefresh = async () => {
        isSpinning = true;

        try {
            await refreshData();
        } finally {
            isSpinning = false;
        }
    };
</script>

<Sidebar />

{#if $todoistResources.items}
    {#if $firstDueTask}
        <Task task={$firstDueTask} on:done={handleDone} on:defer={handleDefer} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}

    <button class="fixed bottom-2 right-2 opacity-50" on:click={handleRefresh}>
        <ArrowPathIcon class="h-6 w-6 {isSpinning ? 'animate-spin' : ''}" />
    </button>
{:else}
    <div class="hero">Loading...</div>
{/if}

{#if $todoistError}
    {@html error(`Error loading Todoist data: ${$todoistError}`) && ""}
{/if}
