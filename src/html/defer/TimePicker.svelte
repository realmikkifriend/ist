<script lang="ts">
    import { onDestroy } from "svelte";
    import { shortcut } from "@svelte-put/shortcut";
    import { updateMilliseconds } from "../../utils/deferModalUtils";
    import { getShiftedSymbol } from "../../utils/deferTimeConfigs";
    import { getPriorityClasses } from "../../styles/styleUtils";
    import ListTask from "../task/ListTask.svelte";
    import type { ShortcutModifierDefinition } from "@svelte-put/shortcut";
    import type { DeferPickerProps, DateButtonConfig } from "../../types/defer";

    let { task, tasks = $bindable(), onDefer }: DeferPickerProps = $props();

    let buttons: HTMLButtonElement[] = $state([]);

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

    const deferButtons = $derived(updateMilliseconds(task, tasks));

    const shortcutTriggers = $derived(
        Array.from({ length: deferButtons.length }, (_, i) => {
            const hotkey = i + 1;
            const button: DateButtonConfig = deferButtons[i];
            const returnKey = {
                key: hotkey >= 10 ? getShiftedSymbol(hotkey - 10) : String(hotkey),
                callback: () => {
                    if (button.ms !== undefined) {
                        handleDefer(Number(button.ms));
                    }
                },
                modifier: (hotkey >= 10 ? "shift" : undefined) as
                    | ShortcutModifierDefinition
                    | undefined,
            };
            return returnKey;
        }),
    );
</script>

<div class="mt-2 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each deferButtons as button, i (button.ms)}
        {#if button.ms !== undefined}
            <div class={button.styling + " relative"}>
                <button
                    bind:this={buttons[i]}
                    class={"btn hover:bg-secondary min-h-4 w-full rounded-md px-1 " +
                        button.stylingButton}
                    onclick={() => handleDefer(Number(button.ms))}
                    type="button">{button.text}</button
                >
                <kbd>{i + 1 >= 10 ? "SHIFT+" + (i - 9) : i + 1}</kbd>
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
<svelte:window
    use:shortcut={{
        trigger: shortcutTriggers,
    }}
/>
