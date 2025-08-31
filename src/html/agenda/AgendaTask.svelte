<script lang="ts">
    import { getContext } from "svelte";
    import { DateTime } from "luxon";
    import { Icon, InboxArrowDown, Inbox, Check, NoSymbol } from "svelte-hero-icons";
    import { getPriorityClasses, colorClasses, borderClasses } from "../../styles/styleUtils";
    import type { Priority } from "../../types/todoist";
    import type { AgendaTaskProps } from "../../types/agenda";
    import type { HandlerMethodsContext } from "../../types/methods";

    let { task, color }: AgendaTaskProps = $props();

    const { summonTask } = getContext<HandlerMethodsContext>("handlerMethods");

    const firstDueClasses = "shadow-sm shadow-red-400";
    const taskPriority = task.priority as Priority;
</script>

<div
    class={[
        "agenda-task mx-1 flex  w-full flex-row items-center overflow-hidden rounded-md px-1 text-xs whitespace-nowrap brightness-90",
        task.priority < 3
            ? colorClasses[color].faded || "bg-gray-600"
            : colorClasses[color].default || "bg-gray-600",
        task.priority < 3 ? `border  ${borderClasses[color] || "border-gray-600"}` : "",
        task.firstDue ? firstDueClasses : "",
    ].join(" ")}
>
    <button
        class={`priority-element relative -left-1.5 mt-0 flex h-fit min-h-2.5 min-w-10 shrink-0 flex-row items-center justify-center rounded-md pr-1 pl-2 text-xs font-bold ${getPriorityClasses(taskPriority)}`}
        onclick={async () => {
            await summonTask(task);
            window.location.hash = "";
        }}
        type="button"
    >
        {#if task.due && task.due.date && task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}

        {#if task.firstDue}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={Inbox} />
        {:else}
            <Icon class="h-3 min-h-3 w-4 min-w-4" src={InboxArrowDown} />
        {/if}
    </button>

    {#if task.neverDone}
        <div
            class="relative -left-0.25 mr-0.75 rounded-full bg-green-200 outline-3 outline-green-200"
            title="task is never marked done"
        >
            <Icon class="relative top-[0.02em] h-2 w-2 stroke-5 text-green-700" src={Check} />
            <Icon
                class="absolute -top-[0.27em] -left-[0.24em] h-[1.2em] w-[1.15em] stroke-3 text-red-500"
                src={NoSymbol}
            />
        </div>
    {/if}

    {task.content}
</div>
