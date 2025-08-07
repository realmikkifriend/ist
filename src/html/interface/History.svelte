<script lang="ts">
    import Calendar from "./Calendar.svelte";
    import type { Task } from "../../types/todoist";

    export let entityId: string;
    export let content: string;
    export let dateInfo: Record<string, { dots: { color: string }[]; tasks: Task[] }> = {};
    export let title: string = "History";
</script>

<dialog id={`calendar_modal_${entityId}`} class="modal">
    <div class="modal-box min-h-[64%] w-84 overflow-hidden">
        <div class="text-md mx-3 w-11/12 border-b-2 border-b-gray-200 p-0">
            <strong>{title}:</strong>
            {content}
        </div>
        <Calendar {dateInfo} disable="future" />
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>
