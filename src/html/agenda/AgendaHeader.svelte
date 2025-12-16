<script lang="ts">
    import { getContext } from "svelte";
    import { Icon, XCircle, Calendar, BarsArrowUp } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import NeverDoneIcon from "./NeverDoneIcon.svelte";
    import { todoistData } from "../../stores/stores";
    import type { AgendaHeaderProps } from "../../types/agenda";
    import type { HandlerMethodsContext } from "../../types/methods";

    let { agendaData, displayData }: AgendaHeaderProps = $props();

    const { summonTask } = getContext<HandlerMethodsContext>("handlerMethods");

    let { tasks, tasksWithNoTime, todayTasks } = $derived(agendaData);
    let { title, headerGradientColor } = $derived(displayData);

    /**
     * Generates plaintext title for the h2 element
     */
    let h2title = $derived(
        tasks.filter((t) => t.neverDone).length > 0
            ? `${tasks.filter((t) => !t.neverDone).length} tasks, ` +
                  `${tasks.filter((t) => t.neverDone).length} routines` +
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
     * Summons the first task from the reverse task list for the current view.
     */
    async function openSkipMode(): Promise<void> {
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
        title="switch agenda view"
        type="button"
    >
        <Icon class="h-5 w-6" src={Calendar} />
        <kbd>a</kbd>
    </button>
    <button
        class="relative rounded-full p-1 transition-colors duration-200 hover:bg-blue-800"
        onclick={openSkipMode}
        title="open skip mode to view tasks in reverse order"
        type="button"
    >
        <Icon class="h-5 w-6" src={BarsArrowUp} />
        <kbd>s</kbd>
    </button>
    <div class="mr-6 flex grow cursor-default flex-col items-center">
        <h1 class="flex-1 text-center">{title}</h1>
        <h2 class="rounded-lg px-3 py-0.5 text-center {headerGradientColor}" title={h2title}>
            {#if tasks.filter((t) => t.neverDone).length > 0 || (todayTasks.length > 0 && window.location.hash === "#tomorrow")}
                <div class="mt-0 mb-1 flex flex-row items-center justify-center gap-1 text-xs">
                    <NeverDoneIcon slash={false} />
                    <span>{tasks.filter((t) => !t.neverDone).length}</span>
                    {#if tasks.filter((t) => t.neverDone).length > 0}
                        <NeverDoneIcon className="ml-1" />
                        <span>{tasks.filter((t) => t.neverDone).length}</span>
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

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "s",
                callback: () => {
                    void openSkipMode();
                },
                modifier: false,
            },
        ],
    }}
/>
