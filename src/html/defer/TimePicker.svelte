<script lang="ts">
    import { onDestroy } from "svelte";
    import { updateMilliseconds } from "../../services/deferModalService";
    import { getPriorityClasses } from "../../utils/styleUtils";
    import ListTask from "../task/ListTask.svelte";
    import type { TimePickerProps } from "../../types/defer";

    let { task, tasks = $bindable(), onDefer }: TimePickerProps = $props();

    const triggerButtonUpdate = (): void => {
        tasks = [...tasks];
    };

    const interval = setInterval(triggerButtonUpdate, 30000);

    onDestroy((): void => {
        clearInterval(interval);
    });

    const handleDefer = (rawTime: number): void => {
        onDefer({ rawTime });
    };
</script>

<div class="mt-2 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each updateMilliseconds(task, tasks) as button (button.ms)}
        {#if button.ms !== undefined}
            <div class={button.styling}>
                <button
                    class={"btn hover:bg-secondary min-h-4 w-full rounded-md px-1 " +
                        button.stylingButton}
                    onclick={() => handleDefer(Number(button.ms))}>{button.text}</button
                >
                {#if button.time}
                    <div class="flex max-h-4 w-full justify-between text-xs">
                        <span
                            class="text-secondary w-fit overflow-hidden text-left opacity-65"
                            class:invisible={button.time && button.time.startsWith("*")}
                            >{button.time && button.time.startsWith("*")
                                ? button.time.slice(1)
                                : button.time}</span
                        >
                        {#if button.tasks && button.tasks.length > 0}
                            <div class="tooltip tooltip-top w-fit cursor-default">
                                <div class="tooltip-content w-40 text-left">
                                    {#each button.tasks as task (task.id)}
                                        <ListTask {task} />
                                    {/each}
                                </div>
                                <span
                                    class="badge badge-xs mt-0 w-fit overflow-hidden px-1 text-right text-xs font-bold {getPriorityClasses(
                                        button.priority ?? 1,
                                    )}">{button.tasks.length}</span
                                >
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    {/each}
</div>
