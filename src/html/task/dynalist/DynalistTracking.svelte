<script lang="ts">
    import { Icon, Check, CalendarDateRange, XMark } from "svelte-hero-icons";
    import type { DynalistNode } from "../../../types/dynalist";
    import { DateTime } from "luxon";
    import Calendar from "../../interface/Calendar.svelte";
    import type { Task } from "../../../types/todoist";

    export let content: DynalistNode;

    $: trackedDates =
        content.children
            ?.map((c) => (typeof c === "string" ? c : c.content))
            .filter((c): c is string => !!c) ?? [];

    $: todayTracked = trackedDates.includes(DateTime.now().toISODate());

    $: dateInfo = trackedDates.reduce(
        (acc, dateStr) => {
            acc[dateStr] = {
                dots: [{ color: "w-8 h-1 bg-red-500" }],
                tasks: [],
            };
            return acc;
        },
        {} as Record<string, { dots: { color: string }[]; tasks: Task[] }>,
    );

    /**
     * Opens the calendar modal.
     */
    function openCalendarModal() {
        const modal = document.getElementById(
            `calendar_modal_${content.id}`,
        ) as HTMLDialogElement | null;
        modal?.showModal();
    }
</script>

<div class="flex flex-row items-center gap-2">
    <button
        class="rounded-full p-0.5 text-white"
        class:bg-blue-500={!todayTracked}
        class:hover:bg-blue-300={!todayTracked}
        class:bg-green-500={todayTracked}
        class:hover:bg-green-300={todayTracked}
    >
        <Icon class="h-6 w-6 p-0.5" src={todayTracked ? XMark : Check} />
    </button>
    <button
        class="bg-neutral hover:bg-secondary rounded-full p-0.5 text-gray-200"
        on:click={openCalendarModal}
    >
        <Icon class="h-6 w-6 p-1" src={CalendarDateRange} />
    </button>
    <span class="text-lg">{content.content}</span>
</div>

<dialog id={`calendar_modal_${content.id}`} class="modal">
    <div class="modal-box min-h-[64%] w-84 overflow-hidden">
        <div class="mx-3 w-11/12 border-b-2 border-b-gray-200 p-0 text-lg">
            <strong>History:</strong>
            {content.content}
        </div>
        <Calendar {dateInfo} disable="future" />
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
