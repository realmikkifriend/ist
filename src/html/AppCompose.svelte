<script lang="ts">
    import { getContext } from "svelte";
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import { firstDueTask } from "../stores/stores";
    import { hashStore } from "../stores/interface";
    import { toggleAgendaHash } from "../services/agendaService";
    import AppView from "./AppView.svelte";
    import Sidebar from "./sidebar/Sidebar.svelte";
    import ContextBadge from "./sidebar/ContextBadge.svelte";
    import Agenda from "./agenda/Agenda.svelte";
    import Toasts from "./interface/Toasts.svelte";
    import type { HandlerMethodsContext } from "../types/methods";

    let { isSpinning, dataPromise } = $props<{
        isSpinning: boolean;
        dataPromise: Promise<void>;
    }>();

    const { handleRefresh } = getContext<HandlerMethodsContext>("handlerMethods");
</script>

<div class="flex w-fit items-center">
    <Sidebar hash={$hashStore} />

    {#if $firstDueTask && $hashStore !== "#today" && $hashStore !== "#tomorrow"}
        {#key $firstDueTask.id}
            <ContextBadge />
        {/key}
    {/if}
</div>

{#if $hashStore === "#today" || $hashStore === "#tomorrow"}
    <Agenda />
{:else}
    <AppView {dataPromise} />
{/if}

<div class="fixed right-2 bottom-2 z-10">
    <button class="bg-base-100 rounded-md p-1" onclick={handleRefresh} type="button">
        <Icon class="h-6 w-6 {isSpinning ? 'animate-spin cursor-wait' : ''}" src={ArrowPath} />
    </button>
</div>

<Toasts />

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "a",
                callback: () => {
                    toggleAgendaHash();
                    window.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: "c",
                            bubbles: true,
                            ctrlKey: true,
                            shiftKey: true,
                        }),
                    );
                },
                modifier: false,
            },
            {
                key: "?",
                callback: () => {
                    document.body.classList.toggle("show-kbd");
                },
                modifier: "shift",
            },
        ],
    }}
/>
