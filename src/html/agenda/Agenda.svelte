<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { on } from "svelte/events";
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import {
        updateAgenda,
        getDisplayHours,
        getTitle,
        computeHeaderGradientColor,
    } from "../../services/agendaService";
    import { getTaskColor } from "../../utils/styleUtils";
    import AgendaHeader from "./AgendaHeader.svelte";
    import AgendaHour from "./AgendaHour.svelte";
    import AgendaTask from "./AgendaTask.svelte";
    import type { AgendaData } from "../../types/agenda";
    import type { Task } from "../../types/todoist";

    let agendaStore = $state<AgendaData>({
        tasks: [],
        tasksForDate: [],
        tasksWithNoTime: [],
        todayTasks: [],
    });

    const hourSlots: number[] = Array.from({ length: 18 }, (_, i) => i + 6);

    const setAgendaData = () => (agendaStore = updateAgenda());

    $effect(() => {
        if ($todoistData) {
            setAgendaData();
        }
    });

    onMount(() => {
        if ($todoistData.tasks) {
            $todoistData.tasks.forEach((task: Task) => {
                delete task.summoned;
                delete task.firstDue;
            });
        }

        setAgendaData();
        on(window, "hashchange", setAgendaData);
    });

    onDestroy(() => {
        window.removeEventListener("hashchange", setAgendaData);
    });
</script>

{#key agendaStore.tasks}
    <div id="agenda" class="-mt-8 mr-4 max-w-lg sm:mx-auto sm:max-w-96">
        <AgendaHeader
            agendaData={agendaStore}
            displayData={{
                title: getTitle(),
                headerGradientColor: computeHeaderGradientColor(agendaStore),
            }}
        />

        {#if agendaStore.tasksWithNoTime.length > 0}
            <div class="mb-4 flex w-full flex-col items-center pr-2 pl-18">
                {#each agendaStore.tasksWithNoTime as task (task.id)}
                    <AgendaTask
                        color={getTaskColor(task.contextId || "0", $todoistData.contexts) ??
                            "berry_red"}
                        {task}
                    />
                {/each}
            </div>
        {/if}

        <div class="w-[99%] overflow-hidden pr-1">
            {#key (DateTime.now().hour, agendaStore.tasks)}
                {#each hourSlots as hour (hour)}
                    {#if getDisplayHours(agendaStore, DateTime.now(), hourSlots)[hour]}
                        <AgendaHour
                            {hour}
                            now={DateTime.now()}
                            tasks={agendaStore.tasks.filter(
                                (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
                            )}
                            title={getTitle()}
                        />
                    {/if}
                {/each}
            {/key}
        </div>
    </div>
{/key}
