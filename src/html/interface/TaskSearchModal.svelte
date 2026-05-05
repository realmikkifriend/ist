<script lang="ts">
    import { getContext } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown } from "svelte-hero-icons";
    import type { Task } from "../../types/todoist";
    import type { HandlerMethodsContext } from "../../types/methods";

    let {
        closeSidebar,
        tasks,
        searchTerm = $bindable(""),
    }: { closeSidebar: () => void; tasks: Task[]; searchTerm: string } = $props();

    const { summonTask } = getContext<HandlerMethodsContext>("handlerMethods");

    const normalizeText = (text: string) =>
        text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const filteredTasks = $derived(
        searchTerm
            ? tasks.filter((task) =>
                  normalizeText(task.content).includes(normalizeText(searchTerm)),
              )
            : [],
    );

    /**
     * Closes the task search modal.
     */
    function closeModal() {
        const modal = document.getElementById("task_search_modal") as HTMLDialogElement;
        modal.close();
    }

    /**
     * Processes typing in search dialog.
     * @param event - Contains the typed input.
     */
    async function handleKeydown(event: KeyboardEvent) {
        event.stopPropagation();
        if (event.key === "Enter" && filteredTasks.length > 0 && searchTerm) {
            await summonTask(filteredTasks[0]);
            closeSidebar();
            closeModal();
        }
    }
</script>

<div
    class="modal-box mt-12 flex max-h-[25.5rem] min-h-6 w-90 flex-col justify-center overflow-hidden"
>
    <!-- svelte-ignore a11y_positive_tabindex -->
    <input
        id="task_search_modal_input"
        name="search"
        class="input input-bordered max-h-8 min-h-8 w-full"
        onkeydown={handleKeydown}
        placeholder="Search tasks..."
        tabindex="1"
        type="text"
        bind:value={searchTerm}
    />
    <div class="grid flex-grow gap-2 overflow-y-auto" class:my-4={filteredTasks.length > 0}>
        {#if filteredTasks.length === 0 && searchTerm}
            <div class="text-error pt-6 text-center">No results...</div>
        {/if}
        {#each filteredTasks as task, i (i)}
            <div class="bg-neutral flex items-center justify-between rounded-lg p-2">
                <div class="w-60">
                    <div class="truncate font-bold">{task.content}</div>
                    {#if task.due}
                        <div class="text-tiny opacity-75">
                            due {DateTime.fromISO(task.due.date).toLocaleString(DateTime.DATE_MED)}
                            ({DateTime.fromISO(task.due.date).toRelative()})
                            {#if task.due.string}
                                <br />
                                repeats <code class="bg-secondary px-0.5">{task.due.string}</code>
                            {/if}
                        </div>
                    {/if}
                </div>
                <button
                    class="btn btn-primary btn-sm"
                    onclick={async () => {
                        await summonTask(task);
                        closeSidebar();
                        closeModal();
                    }}
                    tabindex={i + 1}
                    title="summon task"
                    type="button"
                >
                    <Icon class="h-4 w-4" src={InboxArrowDown} />
                </button>
            </div>
        {/each}
    </div>
</div>
