<script lang="ts">
    import { getPriorityClasses } from "../../utils/styleUtils";
    import ListTask from "../task/ListTask.svelte";
    import type { Priority, ContextButtonProps } from "../../types/todoist";

    let { context, tasksForContext, isDisabled }: ContextButtonProps = $props();
</script>

{#if !isDisabled}
    <div class="tooltip-content w-70 text-left">
        {tasksForContext.total} tasks due in this context:
        <div class="my-2 space-y-1">
            {#each tasksForContext.tasks as task (task.id)}
                <ListTask {task} />
            {/each}
        </div>
    </div>
{/if}

<div class="gap-0 px-2 py-1">
    <p class="cursor-pointer text-left text-lg font-bold">{context.name}</p>
    <div class="flex flex-row items-start space-x-2">
        {#each Object.keys(tasksForContext.priorities).sort((a, b) => +b - +a) as priorityStr, index (index)}
            <div class="flex flex-row items-start space-x-1 py-1">
                {#each Array.from( { length: tasksForContext.priorities[+priorityStr] }, ) as _, badgeIndex (badgeIndex)}
                    <div
                        class="h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {getPriorityClasses(
                            +priorityStr as Priority,
                        )}"
                    ></div>
                {/each}
            </div>
        {/each}
    </div>
</div>
