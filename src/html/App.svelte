<script>
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
    import { DateTime } from "luxon";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { todoistData, todoistError, userSettings, firstDueTask } from "../js/stores";
    import { updateFirstDueTask } from "../js/first";
    import { refreshData } from "../js/api";
    import { error } from "../js/toasts";
    import { handleTaskDone, handleTaskDefer } from "../js/taskHandlers";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import NoTasks from "./NoTasks.svelte";
    import TaskDisplay from "./task/TaskDisplay.svelte";
    import Agenda from "./agenda/Agenda.svelte";

    const isSpinning = writable(false);
    const hash = writable(window.location.hash);

    $: {
        if ($userSettings.selectedContext || $todoistData.dueTasks) {
            updateFirstDueTask();
        }
    }

    onMount(() => {
        const updateHash = () => hash.set(window.location.hash);

        window.addEventListener("hashchange", updateHash);

        updateHash();

        handleRefresh();

        const interval = setInterval(async () => {
            await handleRefresh();
        }, 300000);

        return () => clearInterval(interval);
    });

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
        isSpinning.set(true);

        await refreshData().finally(() => {
            isSpinning.set(false);
        });
    };

    const dataPromise = () => handleRefresh();
</script>

<div class="flex w-fit items-center">
    <Sidebar hash={$hash} />

    {#if $firstDueTask && $hash !== "#today" && $hash !== "#tomorrow"}
        {#key ($firstDueTask, $todoistData)}
            <ContextBadge class="ml-4" />
        {/key}
    {/if}
</div>

{#if $hash === "#today" || $hash === "#tomorrow"}
    <Agenda />
{:else}
    {#await dataPromise()}
        <div class="hero">Loading...</div>
    {:then}
        {#if $todoistData.tasks}
            {#if $firstDueTask}
                {#key $firstDueTask}
                    <TaskDisplay task={$firstDueTask} on:done={handleDone} on:defer={handleDefer} />
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
        {error($todoistError)}
    {/if}
{/if}

<button class="fixed bottom-2 right-2 z-20 rounded-md bg-base-100 p-1" on:click={handleRefresh}>
    <Icon src={ArrowPath} class="h-6 w-6 {$isSpinning ? 'animate-spin' : ''}" />
</button>
