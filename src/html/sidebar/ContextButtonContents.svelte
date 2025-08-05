<script lang="ts">
    import { getPriorityClasses } from "../../utils/styleUtils";
    import ListTask from "../task/ListTask.svelte";
    import type { Priority, Context, TasksGroupedByContext } from "../../types/todoist";

    export let context: Context;
    export let tasksForContext: TasksGroupedByContext[string];

    /**
     * Returns the CSS class for a given priority.
     * Necessary because Svelte 4 templates can't include type assertions.
     * @param priorityNum - The given priority.
     * @returns The Tailwind classes that correspond to the priority.
     */
    function getPriorityBadgeClass(priorityNum: number): string {
        // Priority is a number enum, so coerce to Priority
        return getPriorityClasses(priorityNum as Priority);
    }
</script>

<div class="tooltip-content w-70 text-left">
    {tasksForContext.total} tasks due in this context:
    <div class="my-2 space-y-1">
        {#each tasksForContext.tasks as task (task.id)}
            <ListTask {task} />
        {/each}
    </div>
</div>

<div class="gap-0 px-2 py-1">
    <p class="cursor-pointer text-left text-lg font-bold">{context.name}</p>
    <div class="flex flex-row items-start space-x-2">
        {#each Object.keys(tasksForContext.priorities).sort((a, b) => +b - +a) as priorityStr, index (index)}
            <div class="flex flex-row items-start space-x-1 py-1">
                {#each Array.from( { length: tasksForContext.priorities[+priorityStr] }, ) as _, badgeIndex (badgeIndex)}
                    <div
                        class="h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {getPriorityBadgeClass(
                            +priorityStr,
                        )}"
                    ></div>
                {/each}
            </div>
        {/each}
    </div>
</div>
