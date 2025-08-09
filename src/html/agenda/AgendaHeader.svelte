<script lang="ts">
    import { Icon, XCircle, Calendar, BarsArrowUp } from "svelte-hero-icons";
    import { todoistData } from "../../stores/stores";
    import { summonTask } from "../../services/firstTaskService";
    import type { AgendaHeaderProps } from "../../types/agenda";

    let { agendaData, displayData }: AgendaHeaderProps = $props();

    let { tasks, tasksWithNoTime, todayTasks } = $derived(agendaData);
    let { title, headerGradientColor } = $derived(displayData);

    /**
     * Switches the agenda view between "today" and "tomorrow".
     */
    function switchView(): void {
        window.location.hash = window.location.hash === "#today" ? "#tomorrow" : "#today";
    }

    /**
     * Summons the first task from the reverse task list for the current view.
     */
    function viewReverseTaskList(): void {
        const reverseTasks =
            title === "Today"
                ? $todoistData.reverseTasks.today
                : $todoistData.reverseTasks.tomorrow;

        if (reverseTasks && reverseTasks.length > 0) {
            summonTask(reverseTasks[0], true);
        }
    }

    /**
     * Closes the agenda by clearing the location hash.
     */
    function closeAgenda(): void {
        window.location.hash = "";
    }
</script>

<div class="flex items-center justify-between pb-2 pl-16">
    <button
        onclick={switchView}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
    >
        <Icon src={Calendar} class="h-5 w-6" />
    </button>
    <button
        onclick={viewReverseTaskList}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
    >
        <Icon src={BarsArrowUp} class="h-5 w-6" />
    </button>
    <div class="mr-6 flex grow cursor-default flex-col items-center">
        <h1 class="flex-1 text-center">{title}</h1>
        <h2 class="rounded-lg px-3 py-0.5 text-center {headerGradientColor}">
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
        onclick={closeAgenda}
        class="rounded-full p-1 transition-colors duration-200 hover:bg-red-700"
    >
        <Icon src={XCircle} class="h-5 w-6" />
    </button>
</div>
