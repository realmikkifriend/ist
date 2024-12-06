<script>
    import { CalendarIcon } from "@krowten/svelte-heroicons";
    import { openAgenda } from "./agenda/agenda";

    const buttonClasses =
        "border-2 space-x-1 border-white rounded-md p-2 flex flex-row items-center";
</script>

<div class="hero flex flex-col">
    <span>No due tasks...</span>

    <div class="mt-3 flex flex-row space-x-4">
        <button class={buttonClasses} on:click={() => openAgenda("today")}>
            <CalendarIcon class="h-4 w-5" /> <span>Today</span>
        </button>
        <button class={buttonClasses} on:click={() => openAgenda("tomorrow")}>
            <CalendarIcon class="h-4 w-5" /> <span>Tomorrow</span>
        </button>
    </div>
</div>
