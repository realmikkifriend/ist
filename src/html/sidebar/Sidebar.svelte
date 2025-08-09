<script lang="ts">
    import { Icon, Bars3, ArrowLeftOnRectangle } from "svelte-hero-icons";
    import Contexts from "./Contexts.svelte";
    import DailyGoal from "../activity/DailyGoal.svelte";
    import Footer from "../interface/Footer.svelte";
    import { todoistData } from "../../stores/stores";
    import { handleLogout } from "../../services/updateService";
    import type { HashProp } from "../../types/interface";

    let { hash }: HashProp = $props();
</script>

<div class="drawer">
    <input id="my-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-row items-center">
        <label
            for="my-drawer"
            class="btn drawer-button hover:bg-primary mt-0 bg-transparent shadow-none"
        >
            {#if hash !== "#today" && hash !== "#tomorrow"}
                <Icon src={Bars3} class="h-8 w-8" />
            {/if}
        </label>
    </div>
    <div class="drawer-side z-30">
        <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <ul class="menu bg-base-100 text-base-content min-h-full w-80 px-4 py-2">
            {#if $todoistData.contexts}
                <Contexts />
            {/if}

            <div class="mt-auto">
                <div class="bg-neutral mb-4 flex w-full flex-row items-center rounded-sm p-2">
                    <DailyGoal />
                </div>
                <Footer />
                <button class="btn btn-secondary w-full" onclick={handleLogout}
                    ><Icon src={ArrowLeftOnRectangle} class="h-6 w-6" />Log Out</button
                >
            </div>
        </ul>
    </div>
</div>
