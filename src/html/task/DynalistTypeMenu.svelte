<script>
    import {
        ChevronDownIcon,
        ListBulletIcon,
        ClipboardDocumentCheckIcon,
        SquaresPlusIcon,
        ArrowPathRoundedSquareIcon,
        InboxIcon,
    } from "@krowten/svelte-heroicons";
    import { getDynalistLogo } from "../../js/logos";

    const iconPairs = [
        { component: ListBulletIcon, label: "Read" },
        { component: ClipboardDocumentCheckIcon, label: "Checklist" },
        { component: SquaresPlusIcon, label: "Count" },
        { component: ArrowPathRoundedSquareIcon, label: "Rotating" },
        { component: InboxIcon, label: "Cross Off" },
    ];
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
    <ul tabindex="-1" class="z-1 menu dropdown-content mr-[-4rem] w-36 rounded-lg bg-neutral p-1">
        {#each iconPairs as { component: IconComponent, label }}
            <span
                class="m-0 flex w-full cursor-pointer flex-row items-center gap-1 rounded p-1 font-bold hover:bg-accent"
            >
                <IconComponent class="mr-1 h-6 w-6" />
                {label}
            </span>
        {/each}
    </ul>
</div>
