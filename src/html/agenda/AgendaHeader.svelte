<script>
    import { XCircleIcon, CalendarIcon, BarsArrowUpIcon } from "@krowten/svelte-heroicons";
    import { summonTask } from "./agenda";
    import { filterAndSortTasks } from "../../js/filter";
    import { todoistData } from "../../js/stores";

    export let title, tasks, tasksWithNoTime, todayTasks, tasksForDate, headerGradientColor;

    let reverseSortedTasks;

    function switchView() {
        window.location.hash = window.location.hash === "#today" ? "#tomorrow" : "#today";
    }

    function viewReverseTaskList() {
        $todoistData.reverseTasks = filterAndSortTasks(tasksForDate, $todoistData.contexts, {
            reverse: true,
        });

        if ($todoistData.reverseTasks.length > 0) {
            summonTask($todoistData.reverseTasks[0], true);
        }
    }

    function closeAgenda() {
        window.location.hash = "";
    }
</script>

<div class="flex items-center justify-between pb-2 pl-16">
    <button
        on:click={switchView}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
    >
        <CalendarIcon class="h-5 w-6" />
    </button>
    <button
        on:click={viewReverseTaskList}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
    >
        <BarsArrowUpIcon class="h-5 w-6" />
    </button>
    <div class="flex flex-grow flex-col items-center">
        <h1 class="flex-1 text-center">{title}</h1>
        <h2 class="rounded-badge px-3 py-0.5 text-center {headerGradientColor}">
            {#if todayTasks.length > 0 && window.location.hash === "#tomorrow"}
                <div class="my-0.5 text-xs/[.5rem]">
                    {tasks.length + tasksWithNoTime.length}+{todayTasks.length}=
                </div>
                {tasks.length + tasksWithNoTime.length + todayTasks.length}
            {:else}
                {tasks.length + tasksWithNoTime.length}
            {/if}
            tasks
        </h2>
    </div>
    <button
        on:click={closeAgenda}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-red-700"
    >
        <XCircleIcon class="h-5 w-6" />
    </button>
</div>
