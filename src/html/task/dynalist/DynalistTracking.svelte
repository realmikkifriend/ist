<script lang="ts">
    import { Icon, CalendarDateRange, Check, XMark, ArrowPath } from "svelte-hero-icons";
    import type { DynalistNode } from "../../../types/dynalist";
    import { DateTime } from "luxon";
    import Calendar from "../../interface/Calendar.svelte";
    import type { Task } from "../../../types/todoist";
    import { handleDynalistTrackingClick } from "../../../services/dynalistService";
    import { writable } from "svelte/store";

    export let content: DynalistNode;
    const isLoading = writable(false);

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

    const handleClick = async () => {
        if ($isLoading) return;
        isLoading.set(true);
        content.children = await handleDynalistTrackingClick(content, todayTracked);
        isLoading.set(false);
    };
</script>

<div class="flex flex-row items-center gap-2">
    <button
        class="group h-5 w-5 rounded-sm text-white outline-2 outline-blue-500 hover:bg-blue-500/25"
        class:bg-blue-500={todayTracked}
        class:hover:bg-blue-300={todayTracked}
        on:click={handleClick}
        disabled={$isLoading}
    >
        <Icon
            src={$isLoading ? ArrowPath : ""}
            class={$isLoading ? "h-5 w-5 animate-spin cursor-wait" : "h-0 w-0"}
        />
        <Icon
            class={!$isLoading
                ? "visible h-5 w-5 p-0.5 group-hover:invisible group-hover:h-0 group-hover:p-0"
                : ""}
            src={todayTracked && !$isLoading ? Check : ""}
        />
        <Icon
            class="invisible h-0 w-0 {!$isLoading
                ? 'group-hover:visible group-hover:h-5 group-hover:p-0.5'
                : ''}"
            src={todayTracked && !$isLoading ? XMark : ""}
        />
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
