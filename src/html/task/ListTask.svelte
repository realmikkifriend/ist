<script lang="ts">
    import { getPriorityClasses } from "../../utils/styleUtils";
    import type { Priority, ListTaskProps } from "../../types/todoist";

    let { task }: ListTaskProps = $props();

    /**
     * Returns the CSS class for a given priority.
     * Necessary because Svelte 4 templates can't include type assertions.
     * @param priorityNum - The given priority.
     * @returns The Tailwind classes that correspond to the priority.
     */
    function getPriorityBadgeClass(priorityNum: number): string {
        return getPriorityClasses(priorityNum as Priority);
    }
</script>

<span class="flex flex-row">
    <div
        class="mt-1.5 mr-1 h-1 w-0.5 max-w-0.5 rounded-sm border-none p-1 {getPriorityBadgeClass(
            task.priority,
        )}"
    ></div>
    {task.content}
</span>
