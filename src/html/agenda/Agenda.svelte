<script lang="ts">
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import { hashStore } from "../../stores/interface";
    import { updateAgenda, getTitle } from "../../services/agendaService";
    import { computeHeaderGradientColor, getDisplayHours } from "../../utils/agendaDisplayUtils";
    import { getTaskColor } from "../../styles/styleUtils";
    import AgendaHeader from "./AgendaHeader.svelte";
    import AgendaHour from "./AgendaHour.svelte";
    import AgendaTask from "./AgendaTask.svelte";
    import type { AgendaData } from "../../types/agenda";

    let agendaStore: AgendaData = $derived(updateAgenda($hashStore));

    const hourSlots: number[] = Array.from({ length: 18 }, (_, i) => i + 6);
</script>

{#key agendaStore.tasks}
    <div id="agenda" class="-mt-8 mr-4 max-w-lg sm:mx-auto sm:max-w-96">
        <AgendaHeader
            agendaData={agendaStore}
            displayData={{
                title: getTitle($hashStore),
                headerGradientColor: computeHeaderGradientColor(agendaStore, getTitle($hashStore)),
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
                    {#if getDisplayHours(agendaStore, DateTime.now(), hourSlots, getTitle($hashStore))[hour]}
                        <AgendaHour
                            {hour}
                            now={DateTime.now()}
                            tasks={agendaStore.tasks.filter(
                                (task) => DateTime.fromISO(task.due?.date ?? "").hour === hour,
                            )}
                            title={getTitle($hashStore)}
                        />
                    {/if}
                {/each}
            {/key}
        </div>
    </div>
{/key}
