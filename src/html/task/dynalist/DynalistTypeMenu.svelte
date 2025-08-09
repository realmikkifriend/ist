<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import {
        Icon,
        ChevronDown,
        ListBullet,
        ClipboardDocumentCheck,
        SquaresPlus,
        ArrowPathRoundedSquare,
        CalendarDateRange,
        Inbox,
    } from "svelte-hero-icons";
    import Logo from "../../interface/Logo.svelte";
    import type { DynalistTaskType, DynalistViewProps } from "../../../types/dynalist";
    import type { IconPair } from "../../../types/interface";

    let { selectedType, url }: DynalistViewProps = $props();

    const iconPairs: IconPair[] = [
        { icon: ListBullet, label: "Read", type: "read" },
        { icon: ClipboardDocumentCheck, label: "Checklist", type: "checklist" },
        { icon: SquaresPlus, label: "Count", type: "count" },
        { icon: ArrowPathRoundedSquare, label: "Rotating", type: "rotating" },
        { icon: Inbox, label: "Cross Off", type: "crossoff" },
        { icon: CalendarDateRange, label: "Tracking", type: "tracking" },
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

<div class="dropdown dropdown-left absolute -top-3 -right-7">
    <div
        class="btn bg-accent hover:bg-primary m-0 flex h-2 min-h-8 flex-row content-center gap-0 border-transparent px-1 py-0 shadow-none"
        role="button"
        tabindex="0"
    >
        <Logo size={6} type="dynalist" />
        <Icon class="h-3 w-3" src={ChevronDown} />
    </div>
    <ul class="menu dropdown-content bg-neutral z-20 -mr-16 w-fit rounded-lg p-1" tabindex="-1">
        {#each iconPairs as { icon, label, type }, index (index)}
            {#if index === 0}
                <span class="cursor-default text-center text-xs text-nowrap"
                    >&mdash;read <a href={url} target="_blank">original document</a>&mdash;</span
                >
            {/if}
            {#if index === 3}
                <span class="text-primary cursor-default text-center text-xs text-nowrap"
                    >&mdash;modify <a class="text-primary" href={url} target="_blank"
                        >original document</a
                    >&mdash;</span
                >
            {/if}
            <button
                class="m-0 flex w-full flex-row items-center gap-1 rounded-sm p-1 font-bold"
                class:cursor-auto={selectedType === type}
                class:cursor-pointer={selectedType !== type}
                class:hover:bg-accent={selectedType !== type}
                class:text-base-100={selectedType === type}
                disabled={selectedType === type}
                onclick={() => handleSelectType(type)}
                type="submit"
            >
                <Icon class="mr-1 h-6 w-6" src={icon} />
                {label}
            </button>
        {/each}
    </ul>
</div>
