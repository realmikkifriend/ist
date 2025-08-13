<script lang="ts">
    import { getContext } from "svelte";
    import { Icon, XCircle, Calendar, BarsArrowUp } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import { todoistData } from "../../stores/stores";
    import type { AgendaHeaderProps } from "../../types/agenda";
    import type { MethodsContext } from "../../types/interface";

    let { agendaData, displayData }: AgendaHeaderProps = $props();

    const { summonTask } = getContext<MethodsContext>("methods");

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
    async function viewReverseTaskList(): Promise<void> {
        const reverseTasks =
            title === "Today"
                ? $todoistData.reverseTasks.today
                : $todoistData.reverseTasks.tomorrow;

        if (reverseTasks && reverseTasks.length > 0) {
            await summonTask(reverseTasks[0], true);
            closeAgenda();
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
        class="relative rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
        onclick={switchView}
        type="button"
    >
        <Icon class="h-5 w-6" src={Calendar} />
        <kbd>a</kbd>
    </button>
    <button
        class="relative rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
        onclick={viewReverseTaskList}
        type="button"
    >
        <Icon class="h-5 w-6" src={BarsArrowUp} />
        <kbd>s</kbd>
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
        class="rounded-full p-1 transition-colors duration-200 hover:bg-red-700"
        onclick={closeAgenda}
        type="button"
    >
        <Icon class="h-5 w-6" src={XCircle} />
    </button>
</div>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "s",
                callback: () => {
                    void viewReverseTaskList();
                },
                modifier: false,
            },
        ],
    }}
/>
