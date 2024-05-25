<script>
    import Sidebar from "./Sidebar.svelte";

    import { onMount, onDestroy } from "svelte";
    import { todoistResources, todoistError, refreshData } from "../js/stores";
    import Task from "./Task.svelte";
    import { checkAndUpdateFirstDueTask } from "../js/first";
    import { error } from "../js/toasts";
    import { handleTaskDone } from "../js/taskHandlers";

    let firstDueTask, previousFirstDueTask, unsubscribe, intervalId;

    const setFirstDueTask = (task) => (firstDueTask = task);
    const setPreviousFirstDueTask = (task) => (previousFirstDueTask = task);

    onMount(async () => {
        unsubscribe = todoistResources.subscribe(($resources) => {
            checkAndUpdateFirstDueTask(
                $resources,
                previousFirstDueTask,
                setFirstDueTask,
                setPreviousFirstDueTask,
            );
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
        handleTaskDone(event, setPreviousFirstDueTask, setFirstDueTask);
    };
</script>

<Sidebar />

{#if $todoistResources.items}
    {#if firstDueTask}
        <Task task={firstDueTask} on:done={handleTaskDoneWrapper} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}
{:else}
    <div class="hero">Loading...</div>
{/if}

{#if $todoistError}
    {@html error(`Error loading Todoist data: ${$todoistError}`) && ""}
{/if}
