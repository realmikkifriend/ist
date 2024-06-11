<script>
    import {
        ChevronDownIcon,
        ListBulletIcon,
        ClipboardDocumentCheckIcon,
        SquaresPlusIcon,
        ArrowPathRoundedSquareIcon,
        InboxIcon,
    } from "@krowten/svelte-heroicons";
    import { createEventDispatcher } from "svelte";
    import { getDynalistLogo } from "../../js/logos";

    export let selectedType;

    const iconPairs = [
        { component: ListBulletIcon, label: "Read", type: "read" },
        { component: ClipboardDocumentCheckIcon, label: "Checklist", type: "checklist" },
        { component: SquaresPlusIcon, label: "Count", type: "count" },
        { component: ArrowPathRoundedSquareIcon, label: "Rotating", type: "rotating" },
        { component: InboxIcon, label: "Cross Off", type: "crossoff" },
    ];

    const dispatcher = createEventDispatcher();

    function handleSelectType(label) {
        dispatcher("selectType", { type: label });
    }
</script>

<div class="dropdown dropdown-left absolute right-[-0.5rem] top-[-0.5rem]">
    <div
        tabindex="0"
        role="button"
        class="btn m-0 h-2 min-h-8 gap-0 border-transparent bg-transparent p-1 pb-2 pt-0 hover:bg-primary"
    >
        {@html getDynalistLogo(6)}
        <ChevronDownIcon class="h-4 w-4" />
    </div>
    <ul tabindex="-1" class="z-1 menu dropdown-content mr-[-4rem] w-fit rounded-lg bg-neutral p-1">
        {#each iconPairs as { component: IconComponent, label, type }, index}
            {#if index === 3}
                <span class="cursor-default text-nowrap text-center text-xs text-primary"
                    >&mdash;modify original document&mdash;</span
                >
            {/if}
            <button
                on:click={() => handleSelectType(type)}
                class="m-0 flex w-full flex-row items-center gap-1 rounded p-1 font-bold {selectedType ===
                type
                    ? 'cursor-auto text-base-100'
                    : 'cursor-pointer hover:bg-accent'}"
                disabled={selectedType === type}
            >
                <IconComponent class="mr-1 h-6 w-6" />
                {label}
            </button>
        {/each}
    </ul>
</div>
