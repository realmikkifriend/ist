<script lang="ts">
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import { getQuarterHourPosition } from "../../js/classes";
    import { markTasks, calculateTaskPosition, calculateTaskStyle } from "./agenda";
    import AgendaTask from "./AgendaTask.svelte";
    import type { Task, Context, ColorName } from "../../../types/todoist";
    import type { QuarterHourPosition } from "../../../types/agenda";

    export let tasks: Task[];
    export let hour: number;
    export let title: string;
    export let now: DateTime;

    const currentHour: boolean = title === "Today" && hour === now.hour;

    /**
     * Returns the color associated with a context ID, or null if not found.
     * @param id - The context ID to look up.
     * @returns The color string or null if not found.
     */
    function getTaskColor(id?: string): ColorName | undefined {
        if (!id) return undefined;
        const context: Context | undefined = $todoistData.contexts.find(
            (context) => context.id === id,
        );
        return context?.color as ColorName | undefined;
    }

    /**
     * Processes the given tasks using markTasks.
     * @param tasks - The tasks to process.
     * @returns The tasks after processing.
     */
    function getProcessedTasks(tasks: Task[]): Task[] {
        return markTasks(tasks);
    }

    const processedTasks: Task[] = getProcessedTasks(tasks);

    const quarterHourPositions: QuarterHourPosition[] = [0.25, 0.5, 0.75];
</script>

<div class="hour group relative flex w-full items-start">
    <div
        class="mr-1 flex w-16 min-w-16 flex-row items-center justify-end text-right font-extrabold"
    >
        {#if tasks.length >= 4}
            <span class="mr-0.5 text-xs text-red-500">4+</span>
        {/if}

        <span class="mr-0.5 text-xs brightness-50">
            {hour % 12 === 0 ? 12 : hour % 12}
            {hour < 12 ? "AM" : "PM"}
        </span>
    </div>

    <div
        class={`hour-container relative ${
            tasks.length >= 4 ? "bg-linear-to-b from-transparent via-red-950" : ""
        } ${
            currentHour ? "z-20" : "z-10"
        } h-24 w-[70%] grow border-2 border-t-0 border-gray-700 group-first:border-t-2`}
    >
        {#each quarterHourPositions as position, index (index)}
            <div
                class={`absolute left-0 w-full border-t border-gray-800 ${getQuarterHourPosition(position)}`}
            ></div>
        {/each}
        {#if currentHour}
            <div
                class="rounded-badge absolute left-0 z-40 h-0.5 w-full bg-red-600"
                style="top: {(now.minute / 60) * 100}%;"
                id="today-marker"
            >
                <div
                    class="absolute -top-[0.2rem] -right-[0.3rem] h-2 w-2 rounded-full bg-red-600"
                ></div>
            </div>
        {/if}
        <div class="clipped flex w-full flex-col py-0.5 pr-1">
            {#each processedTasks as task, index (index)}
                <div
                    class={`task-container w-[98%] ${calculateTaskStyle(index, processedTasks)}`}
                    style={`margin-top: ${calculateTaskPosition(task, processedTasks[index - 1])}rem; filter: ${task.due && DateTime.fromISO(task.due.date) > now && title === "Today" ? "brightness(0.75)" : "brightness(1)"};`}
                >
                    <AgendaTask {task} color={getTaskColor(task.contextId) ?? "berry_red"} />
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .clipped {
        clip-path: inset(0 0.01rem -15rem 0);
    }
</style>
