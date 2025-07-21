<script>
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { getPriorityClasses } from "../../js/classes";
    import { updateMilliseconds } from "./defer.js";

    export let task, tasks;

    let buttons = [];

    const updateButtons = () => {
        buttons = updateMilliseconds(task, tasks);
    };

    onMount(() => {
        updateButtons();
    });

    const interval = setInterval(updateButtons, 30000);

    onDestroy(() => {
        clearInterval(interval);
    });

    const dispatch = createEventDispatcher();

    const handleDefer = (rawTime) => {
        dispatch("defer", { rawTime });
    };
</script>

<div class="mt-2 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each buttons as button (button.ms)}
        <div class={button.styling}>
            <button
                class="btn min-h-4 w-full rounded-md px-1 hover:bg-secondary {button.stylingButton}"
                on:click={() => handleDefer(button.ms)}
                >{button.text}
            </button>
            {#if button.time}
                <div class="flex max-h-4 w-full justify-between overflow-hidden text-xs opacity-65">
                    <span class="w-fit overflow-hidden text-left text-secondary"
                        >{@html button.time}</span
                    >
                    <span
                        class="badge badge-xs mt-0.5 w-fit overflow-hidden text-right font-bold {getPriorityClasses(
                            button.priority,
                        )}">{button.count}</span
                    >
                </div>
            {/if}
        </div>
    {/each}
</div>
