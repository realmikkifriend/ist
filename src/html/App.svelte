<script>
    import { onMount, onDestroy } from "svelte";
    import { DateTime } from "luxon";
    import { ArrowPathIcon } from "@krowten/svelte-heroicons";
    import { todoistResources, todoistError, userSettings, firstDueTask } from "../js/stores";
    import { updateFirstDueTask } from "../js/first";
    import { refreshData } from "../js/api";
    import { error } from "../js/toasts";
    import { handleTaskDone, handleTaskDefer } from "../js/taskHandlers";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import NoTasks from "./NoTasks.svelte";
    import Task from "./task/Task.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import { writable } from "svelte/store";

    let autoRefresh,
        isSpinning = false,
        dataPromise;

    const hash = writable(window.location.hash);

    $: {
        $userSettings.selectedContextId;
        $todoistResources.dueTasks;
        updateFirstDueTask();
    }

    onMount(() => {
        const updateHash = () => hash.set(window.location.hash);

        window.addEventListener("hashchange", updateHash);

        updateHash();

        dataPromise = handleRefresh();

        autoRefresh = setInterval(async () => {
            await handleRefresh();
        }, 300000);
    });

    onDestroy(() => {
        clearInterval(autoRefresh);
        window.removeEventListener("hashchange", updateHash);
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
        isSpinning = true;

        try {
            await refreshData();
        } finally {
            isSpinning = false;
        }
    };
</script>

<div class="flex w-fit items-center">
    <Sidebar />

    {#if $firstDueTask && $hash !== "#today" && $hash !== "#tomorrow"}
        <ContextBadge class="ml-4" />
    {/if}
</div>

{#if $hash === "#today" || $hash === "#tomorrow"}
    <Agenda />
{:else}
    {#await dataPromise}
        <div class="hero">Loading...</div>
    {:then}
        {#if $todoistResources.items}
            {#if $firstDueTask}
                <Task task={$firstDueTask} on:done={handleDone} on:defer={handleDefer} />
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
        {@html error(
            $todoistError.includes("NetworkError")
                ? "Offline..."
                : `Error loading Todoist data: ${$todoistError}`,
        ) && ""}
    {/if}
{/if}

<button class="fixed bottom-2 right-2 z-20 rounded-md bg-base-100 p-1" on:click={handleRefresh}>
    <ArrowPathIcon class="h-6 w-6 {isSpinning ? 'animate-spin' : ''}" />
</button>
