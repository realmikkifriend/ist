<script lang="ts">
    import { createEventDispatcher, onDestroy } from "svelte";
    import { getPriorityClasses } from "../../js/classes";
    import { updateMilliseconds } from "./defer";
    import type { Task } from "../../../types/todoist";
    // import type { TimeButtonConfig } from "../../../types/defer";

    export let task: Task;
    export let tasks: Task[];

    const triggerButtonUpdate = (): void => {
        tasks = [...tasks];
    };

    const interval = setInterval(triggerButtonUpdate, 30000);

    onDestroy((): void => {
        clearInterval(interval);
    });

    const dispatch = createEventDispatcher<{ defer: { rawTime: number } }>();

    const handleDefer = (rawTime: number): void => {
        dispatch("defer", { rawTime });
    };
</script>

<div class="mt-2 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each updateMilliseconds(task, tasks) as button (button.ms)}
        {#if button.ms !== undefined}
            <div class={button.styling}>
                <button
                    class={"btn min-h-4 w-full rounded-md px-1 hover:bg-secondary " +
                        button.stylingButton}
                    on:click={() => handleDefer(Number(button.ms))}>{button.text}</button
                >
                {#if button.time}
                    <div
                        class="flex max-h-4 w-full justify-between overflow-hidden text-xs opacity-65"
                    >
                        <span
                            class="w-fit overflow-hidden text-left text-secondary"
                            class:italic={button.time && button.time.startsWith("*")}
                            >{button.time && button.time.startsWith("*")
                                ? button.time.slice(1)
                                : button.time}</span
                        >
                        {#if button.count}
                            <span
                                class="badge badge-xs mt-0.5 w-fit overflow-hidden text-right font-bold {getPriorityClasses(
                                    button.priority ?? 1,
                                )}">{button.count}</span
                            >
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    {/each}
</div>
