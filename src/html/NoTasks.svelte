<script lang="ts">
    import { Icon, Calendar } from "svelte-hero-icons";
    import { openAgenda } from "../services/agendaService";

    const buttonClasses: string =
        "border-2 space-x-1 border-white rounded-md p-2 flex flex-row items-center";
</script>

<div class="hero flex flex-col">
    <span>No due tasks...</span>

    <div class="mt-3 flex flex-row space-x-4">
        <button class={buttonClasses} onclick={() => openAgenda("today")} type="button">
            <Icon class="h-4 w-5" src={Calendar} /> <span>Today</span>
        </button>
        <button class={buttonClasses} onclick={() => openAgenda("tomorrow")} type="button">
            <Icon class="h-4 w-5" src={Calendar} /> <span>Tomorrow</span>
        </button>
    </div>
</div>
