<script lang="ts">
    import { Icon, Check, NoSymbol } from "svelte-hero-icons";

    export let slash: boolean = true;
    export let className: string = "";
</script>

<div
    class={`relative rounded-full bg-green-200 outline-3 outline-green-200 ${className}`}
    title="task is never marked done"
>
    <Icon class="relative top-[0.02em] h-2 w-2 stroke-5 text-green-700" src={Check} />
    {#if slash}
        <Icon
            class="absolute -top-[0.27em] -left-[0.24em] h-[1.2em] w-[1.15em] stroke-3 text-red-500"
            src={NoSymbol}
        />
    {/if}
</div>
