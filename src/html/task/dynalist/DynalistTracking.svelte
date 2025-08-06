<script lang="ts">
    import { Icon, Check, CalendarDateRange } from "svelte-hero-icons";
    import type { DynalistNode } from "../../../types/dynalist";
    export let content: DynalistNode;

    console.log(content);
</script>

<div class="flex flex-row gap-2">
    <button class="rounded-full bg-blue-500 p-1 text-white">
        <Icon class="h-6 w-6 p-0.5" src={Check} />
    </button>
    <button class="bg-neutral rounded-full p-0.5 text-gray-200">
        <Icon class="h-6 w-6 p-1" src={CalendarDateRange} />
    </button>
    <span class="text-lg">{content.content}</span>
</div>
