<script lang="ts">
    import { Icon, XCircle, Calendar } from "svelte-hero-icons";
    import NeverDoneIcon from "./NeverDoneIcon.svelte";
    import type { AgendaHeaderProps } from "../../types/agenda";

    let { agendaData, displayData }: AgendaHeaderProps = $props();

    let { tasks, tasksWithNoTime, todayTasks } = $derived(agendaData);
    let { title, headerGradientColor } = $derived(displayData);

    /**
     * Combines .neverDone tasks from both tasks and tasksWithNoTime
     */
    let tasksNeverDone = $derived([
        ...tasks.filter((t) => t.neverDone),
        ...tasksWithNoTime.filter((t) => t.neverDone),
    ]);

    /**
     * Generates plaintext title for the h2 element
     */
    let h2title = $derived(
        tasksNeverDone.length > 0
            ? `${tasks.length + tasksWithNoTime.length - tasksNeverDone.length} tasks, ` +
                  `${tasksNeverDone.length} routines` +
                  `${todayTasks.length > 0 && window.location.hash === "#tomorrow" ? `,\n${todayTasks.length} tasks left over from today` : ""}`
            : `${tasks.length + tasksWithNoTime.length} tasks`,
    );

    /**
     * Switches the agenda view between "today" and "tomorrow".
     */
    function switchView(): void {
        window.location.hash = window.location.hash === "#today" ? "#tomorrow" : "#today";
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
        title="switch agenda view"
        type="button"
    >
        <Icon class="h-5 w-6" src={Calendar} />
        <kbd>a</kbd>
    </button>
    <div class="mr-6 flex grow cursor-default flex-col items-center">
        <h1 class="flex-1 text-center">{title}</h1>
        <h2 class="rounded-lg px-3 py-0.5 text-center {headerGradientColor}" title={h2title}>
            {#if tasksNeverDone.length > 0 || (todayTasks.length > 0 && window.location.hash === "#tomorrow")}
                <div class="mt-0 mb-1 flex flex-row items-center justify-center gap-1 text-xs">
                    <NeverDoneIcon slash={false} />
                    <span>{tasks.length + tasksWithNoTime.length - tasksNeverDone.length}</span>
                    {#if tasksNeverDone.length > 0}
                        <NeverDoneIcon className="ml-1" />
                        <span>{tasksNeverDone.length}</span>
                    {/if}
                    {#if todayTasks.length > 0 && window.location.hash === "#tomorrow"}
                        <span class="ml-0.5 w-2.5 text-[0.8em]">&#9888;&#65039;</span>
                        {todayTasks.length}
                    {/if}
                </div>
            {/if}
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
