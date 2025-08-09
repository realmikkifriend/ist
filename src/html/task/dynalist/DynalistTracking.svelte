<script lang="ts">
    import { DateTime } from "luxon";
    import { Icon, CalendarDateRange, Check, XMark, ArrowPath } from "svelte-hero-icons";
    import { handleDynalistTrackingClick } from "../../../services/dynalistService";
    import History from "../../interface/History.svelte";
    import type { Task } from "../../../types/todoist";
    import type { DynalistNode } from "../../../types/dynalist";

    let { dynalistObject: content = $bindable() }: { dynalistObject?: DynalistNode } = $props();
    let isLoading = $state(false);

    let trackedDates: string[] = $derived(
        Array.isArray(content?.children)
            ? content.children
                  .map((c: DynalistNode | string) => (typeof c === "string" ? c : c.content))
                  .filter((c): c is string => !!c)
            : [],
    );

    let todayTracked = $derived(trackedDates.includes(DateTime.now().toISODate()));

    let dateInfo: Record<string, { dots: { color: string }[]; tasks: Task[] }> | undefined =
        $derived(
            trackedDates.length > 0
                ? trackedDates.reduce(
                      (
                          acc: Record<string, { dots: { color: string }[]; tasks: Task[] }>,
                          dateStr: string,
                      ) => {
                          acc[dateStr] = {
                              dots: [{ color: "w-8 h-1 bg-red-500" }],
                              tasks: [],
                          };
                          return acc;
                      },
                      {},
                  )
                : undefined,
        );

    /**
     * Opens the calendar modal.
     */
    function openCalendarModal() {
        const modal = document.getElementById(
            `calendar_modal_${content?.id}`,
        ) as HTMLDialogElement | null;
        modal?.showModal();
    }

    const handleClick = async () => {
        if (isLoading || !content) return;
        isLoading = true;
        content.children = await handleDynalistTrackingClick(content, todayTracked);
        isLoading = false;
    };
</script>

<div class="mb-2 flex min-h-8 flex-row items-center gap-2">
    <button
        class="group h-5 w-5 rounded-sm text-white outline-2 outline-blue-500 hover:bg-blue-500/25"
        class:bg-blue-500={todayTracked}
        class:hover:bg-blue-300={todayTracked}
        disabled={isLoading}
        onclick={handleClick}
        type="button"
    >
        <Icon
            class={isLoading ? "h-5 w-5 animate-spin cursor-wait" : "h-0 w-0"}
            src={isLoading ? ArrowPath : ""}
        />
        <Icon
            class={!isLoading
                ? "visible h-5 w-5 p-0.5 group-hover:invisible group-hover:h-0 group-hover:p-0"
                : ""}
            src={todayTracked && !isLoading ? Check : ""}
        />
        <Icon
            class="invisible h-0 w-0 {!isLoading
                ? 'group-hover:visible group-hover:h-5 group-hover:p-0.5'
                : ''}"
            src={todayTracked && !isLoading ? XMark : ""}
        />
    </button>
    <button
        class="bg-neutral hover:bg-secondary rounded-full p-0.5 text-gray-200"
        onclick={openCalendarModal}
        type="button"
    >
        <Icon class="h-6 w-6 p-1" src={CalendarDateRange} />
    </button>
    <span class="text-lg">{content?.content}</span>
</div>
<History
    activity={dateInfo}
    content={content?.content ?? ""}
    entityId={content?.id ?? ""}
    title="History"
/>
