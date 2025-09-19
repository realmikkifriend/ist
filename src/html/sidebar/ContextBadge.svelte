<script lang="ts">
    import { getContext } from "svelte";
    import { shortcut } from "@svelte-put/shortcut";
    import { Icon, XMark } from "svelte-hero-icons";
    import { todoistData, displayTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { getDueTaskCountByContext } from "../../utils/filterUtils";
    import { getSelectedContextName } from "../../utils/firstTaskUtils";
    import type { HandlerMethodsContext } from "../../types/methods";

    const { handleContextChange } = getContext<HandlerMethodsContext>("handlerMethods");

    const dueTaskCount = $derived(
        getDueTaskCountByContext($todoistData.dueTasks, $displayTask ?? null, $userSettings),
    );
</script>

<button
    class="group badge badge-outline relative items-center whitespace-nowrap"
    class:!cursor-default={!$displayTask?.summoned && !$userSettings.selectedContext}
    class:border-purple-400={$displayTask?.summoned}
    class:border-yellow-500={$displayTask?.skip}
    class:cursor-pointer={$userSettings.selectedContext}
    class:opacity-40={!$userSettings.selectedContext}
    class:opacity-75={$userSettings.selectedContext}
    class:text-primary={$userSettings.selectedContext}
    class:text-purple-400={$displayTask?.summoned}
    class:text-yellow-500={$displayTask?.skip}
    onclick={() => {
        handleContextChange(null);
    }}
    type="reset"
>
    {#if $displayTask?.skip}
        low priority, defer?
        <kbd>x</kbd>
    {:else if $displayTask?.summoned}
        summoned task
        <kbd>x</kbd>
    {:else if dueTaskCount === 0}
        loading...
    {:else}
        {dueTaskCount} left in {getSelectedContextName($todoistData, $userSettings, $displayTask)}
    {/if}
    {#if $userSettings.selectedContext || $displayTask?.summoned}
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
                handleContextChange(null);
            },
            modifier: false,
        },
    }}
/>
