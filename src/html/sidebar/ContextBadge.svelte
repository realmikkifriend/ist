<script lang="ts">
    import { getContext } from "svelte";
    import { shortcut } from "@svelte-put/shortcut";
    import { Icon, XMark } from "svelte-hero-icons";
    import { todoistData, firstDueTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { getDueTaskCountByContext } from "../../utils/filterUtils";
    import { getSelectedContextName } from "../../utils/firstTaskUtils";
    import type { MethodsContext } from "../../types/interface";

    const { handleClearSelectedTask, handleContextChange } = getContext<MethodsContext>("methods");

    const dueTaskCount = $derived(
        getDueTaskCountByContext($todoistData.dueTasks, $firstDueTask ?? null, $userSettings),
    );
</script>

<button
    class="group badge badge-outline relative items-center whitespace-nowrap"
    class:border-purple-400={$firstDueTask?.summoned}
    class:border-yellow-500={$firstDueTask?.skip}
    class:cursor-default={!$firstDueTask?.summoned && !$userSettings.selectedContext}
    class:cursor-pointer={$userSettings.selectedContext}
    class:opacity-40={!$userSettings.selectedContext}
    class:opacity-75={$userSettings.selectedContext}
    class:text-primary={$userSettings.selectedContext}
    class:text-purple-400={$firstDueTask?.summoned}
    class:text-yellow-500={$firstDueTask?.skip}
    onclick={() => {
        handleContextChange(null);
    }}
    type="reset"
>
    {#if $firstDueTask?.skip}
        low priority, defer?
        <kbd>x</kbd>
    {:else if $firstDueTask?.summoned}
        summoned task
        <kbd>x</kbd>
    {:else if dueTaskCount === 0}
        loading...
    {:else}
        {dueTaskCount} left in {getSelectedContextName($todoistData, $userSettings, $firstDueTask)}
    {/if}
    {#if $userSettings.selectedContext || $firstDueTask?.summoned}
        <p class="block sm:hidden sm:group-hover:block">
            <Icon class="h-4 w-4" src={XMark} />
        </p>
        <kbd>x</kbd>
    {/if}
</button>

<svelte:window
    use:shortcut={{
        trigger: {
            key: "x",
            callback: () => {
                void handleClearSelectedTask();
            },
            modifier: false,
        },
    }}
/>
