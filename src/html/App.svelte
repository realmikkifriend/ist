<script>
    import { onMount, onDestroy } from "svelte";
    import { todoistResources, todoistError, refreshData } from "../js/stores";
    import Task from "./Task.svelte";
    import { checkAndUpdateFirstDueTask } from "../js/first";
    import { error } from "../js/toasts";

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

    const handleTaskDone = (event) => {
        todoistResources.update(($resources) => {
            const index = $resources.dueTasks.findIndex((task) => task.id === event.detail.task.id);
            if (index !== -1 && index < $resources.dueTasks.length - 1) {
                setFirstDueTask($resources.dueTasks[index + 1]);
            } else {
                setFirstDueTask(null);
            }
            return $resources;
        });
        refreshData();
    };
</script>

{#if $todoistResources.items}
    {#if firstDueTask}
        <Task task={firstDueTask} on:done={handleTaskDone} />
    {:else}
        <div class="hero">No due tasks</div>
    {/if}
{:else}
    <div class="hero">Loading...</div>
{/if}

{#if $todoistError}
    {@html error(`Error loading Todoist data: ${$todoistError}`) && ""}
{/if}
