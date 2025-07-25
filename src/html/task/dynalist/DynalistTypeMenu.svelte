<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Icon,
        ChevronDown,
        ListBullet,
        ClipboardDocumentCheck,
        SquaresPlus,
        ArrowPathRoundedSquare,
        Inbox,
    } from "svelte-hero-icons";
    // @ts-expect-error until file is converted to TypeScript
    import Logo from "../../Logo.svelte";
    import type { DynalistTaskType } from "../../../../types/dynalist";

    export let selectedType: DynalistTaskType;
    export let url: string;

    interface IconPair {
        icon: typeof ListBullet;
        label: string;
        type: DynalistTaskType;
    }

    const iconPairs: IconPair[] = [
        { icon: ListBullet, label: "Read", type: "read" },
        { icon: ClipboardDocumentCheck, label: "Checklist", type: "checklist" },
        { icon: SquaresPlus, label: "Count", type: "count" },
        { icon: ArrowPathRoundedSquare, label: "Rotating", type: "rotating" },
        { icon: Inbox, label: "Cross Off", type: "crossoff" },
    ];

    const dispatcher = createEventDispatcher<{ selectType: { type: DynalistTaskType } }>();

    /**
     * Dispatches a selectType event with the chosen Dynalist task type.
     * @param type - The selected Dynalist task type.
     */
    function handleSelectType(type: DynalistTaskType): void {
        dispatcher("selectType", { type });
    }
</script>

<div class="dropdown dropdown-left absolute -right-7 -top-3">
    <div
        tabindex="0"
        role="button"
        class="btn m-0 h-2 min-h-8 gap-0 border-transparent bg-accent p-1 pb-3 pt-0 shadow-none hover:bg-primary"
    >
        <Logo type="dynalist" size={6} />
        <Icon src={ChevronDown} class="h-3 w-3" />
    </div>
    <ul tabindex="-1" class="menu dropdown-content z-20 mr-[-4rem] w-fit rounded-lg bg-neutral p-1">
        {#each iconPairs as { icon, label, type }, index (index)}
            {#if index === 0}
                <span class="cursor-default text-nowrap text-center text-xs"
                    >&mdash;read <a target="_blank" href={url}>original document</a>&mdash;</span
                >
            {/if}
            {#if index === 3}
                <span class="cursor-default text-nowrap text-center text-xs text-primary"
                    >&mdash;modify <a class="text-primary" target="_blank" href={url}
                        >original document</a
                    >&mdash;</span
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
                <Icon src={icon} class="mr-1 h-6 w-6" />
                {label}
            </button>
        {/each}
    </ul>
</div>
