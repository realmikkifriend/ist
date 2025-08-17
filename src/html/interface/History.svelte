<script lang="ts">
    import { processActivityForCalendar } from "../../utils/calendarUtils";
    import Calendar from "./Calendar.svelte";
    import type { HistoryProps } from "../../types/calendar";

    let { entityId, content, activity, title = "History" }: HistoryProps = $props();

    const dateInfo = Promise.resolve(activity).then((res) => {
        if (Array.isArray(res)) {
            return processActivityForCalendar(res);
        }
        return res || {};
    });
</script>

<dialog id={`calendar_modal_${entityId}`} class="modal">
    <div class="modal-box min-h-[64%] w-84 overflow-hidden">
        <div class="text-md mx-3 w-11/12 border-b-2 border-b-gray-200 p-0">
            <strong>{title}:</strong>
            {content}
        </div>
        {#await dateInfo}
            <div class="flex h-full animate-pulse items-center justify-center blur-xs">
                <Calendar disable="future" />
            </div>
        {:then resolvedDateInfo}
            <Calendar dateInfo={resolvedDateInfo} disable="future" />
        {/await}
    </div>
    <form class="modal-backdrop" method="dialog">
        <button type="submit">close</button>
    </form>
</dialog>
