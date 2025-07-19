<script>
    import { ArrowPathIcon, KeyIcon } from "@krowten/svelte-heroicons";
    import { dynalistAccessToken } from "../../../js/stores";
    import { success } from "../../../js/toasts";
    import { getDynalistLogo } from "../../../js/logos";
    import { handleToken as validateDynalistToken } from "./dynalistApi";

    let tempToken = "";
    let isSubmitting = false;
    let isTokenInvalid = false;

    async function handleToken(event) {
        event.preventDefault();
        isSubmitting = true;
        isTokenInvalid = false;

        const result = await validateDynalistToken(tempToken);
        if (result.success) {
            success("Dynalist access token set!");
            dynalistAccessToken.set(tempToken);
        } else {
            isTokenInvalid = true;
        }
        isSubmitting = false;
    }
</script>

<div class="dynalistPrompt w-full">
    <div class="flex h-auto items-center space-x-1">
        {@html getDynalistLogo(8)}
        <div class="overflow-x-hidden text-nowrap">
            Provide <a
                href="https://dynalist.io/developer"
                class="href text-blue-500 hover:underline">Dynalist access</a
            >
            {#if isTokenInvalid}
                <p class="text-red-500">Invalid token</p>
            {/if}
        </div>
    </div>
    {#if !isSubmitting}
        <form class="flex gap-2" on:submit={handleToken}>
            <input
                type="text"
                placeholder="Enter your token"
                class="input min-w-4 flex-grow"
                bind:value={tempToken}
            />
            <button
                type="submit"
                class="btn flex-grow-0 bg-primary text-white hover:bg-primary hover:opacity-75"
                ><KeyIcon class="h-5 w-5" /></button
            >
        </form>
    {:else}
        <ArrowPathIcon class="h-6 w-6 animate-spin" />
    {/if}
</div>
