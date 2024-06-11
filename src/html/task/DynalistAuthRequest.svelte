<script>
    import { ArrowPathIcon, KeyIcon } from "@krowten/svelte-heroicons";
    import { dynalistAccessToken } from "../../js/stores";
    import { success } from "../../js/toasts";
    import { getDynalistLogo } from "../../js/logos";

    let tempToken = "";
    let isSubmitting = false;
    let isTokenInvalid = false;

    async function handleToken(event) {
        event.preventDefault();
        isSubmitting = true;
        isTokenInvalid = false;

        if (/^[a-zA-Z0-9_]+$/.test(tempToken)) {
            try {
                const response = await fetch("https://dynalist.io/api/v1/pref/get", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: tempToken, key: "inbox_location" }),
                });
                const result = await response.json();
                if (response.ok && result._code !== "InvalidToken") {
                    success("Dynalist access token set!");
                    dynalistAccessToken.set(tempToken);
                } else {
                    console.error("API request failed:", result);
                    isTokenInvalid = true;
                }
            } catch (error) {
                console.error("Network or other error:", error);
                isTokenInvalid = true;
            } finally {
                isSubmitting = false;
            }
        } else {
            isSubmitting = false;
            isTokenInvalid = true;
        }
    }
</script>

<div class="dynalistPrompt">
    <div class="flex h-auto items-center space-x-1">
        {@html getDynalistLogo(8)}
        <div>
            Provide <a
                href="https://dynalist.io/developer"
                class="href text-blue-500 hover:underline">Dynalist access token</a
            >...
            {#if isTokenInvalid}
                <p class="text-red-500">Invalid token</p>
            {/if}
        </div>
    </div>
    {#if !isSubmitting}
        <form class="flex w-full gap-2" on:submit={handleToken}>
            <input
                type="text"
                placeholder="Enter your token"
                class="input flex-grow"
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
