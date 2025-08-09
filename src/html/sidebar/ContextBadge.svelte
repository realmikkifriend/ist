<script lang="ts">
    import { Icon, XMark } from "svelte-hero-icons";
    import { todoistData, firstDueTask } from "../../stores/stores";
    import { userSettings } from "../../stores/interface";
    import { getDueTaskCountByContext } from "../../services/sidebarService";
    import { clearSelectedTask } from "../../services/firstTaskService";
    import { getSelectedContextName } from "../../utils/firstTaskUtils";
</script>

<button
    class="group badge badge-outline items-center whitespace-nowrap"
    class:border-purple-400={$firstDueTask?.summoned}
    class:border-yellow-500={$firstDueTask?.skip}
    class:cursor-default={!$firstDueTask?.summoned && !$userSettings.selectedContext}
    class:cursor-pointer={$userSettings.selectedContext}
    class:opacity-40={!$userSettings.selectedContext}
    class:opacity-75={$userSettings.selectedContext}
    class:text-primary={$userSettings.selectedContext}
    class:text-purple-400={$firstDueTask?.summoned}
    class:text-yellow-500={$firstDueTask?.skip}
    onclick={clearSelectedTask}
    type="reset"
>
    {#if $firstDueTask?.skip}
        low priority, defer?
    {:else if $firstDueTask?.summoned}
        summoned task
    {:else}
        {getDueTaskCountByContext($firstDueTask?.contextId ?? "")} left in {getSelectedContextName(
            $todoistData,
            $userSettings,
            $firstDueTask,
        )}
    {/if}
    {#if $userSettings.selectedContext || $firstDueTask?.summoned}
        <p class="ml-1 block sm:hidden sm:group-hover:block">
            <Icon class="h-4 w-4" src={XMark} />
        </p>
    {/if}
</button>
