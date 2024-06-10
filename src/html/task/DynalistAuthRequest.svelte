<script>
    import { ArrowPathIcon, KeyIcon } from "@krowten/svelte-heroicons";
    import { dynalistAccessToken } from "../../js/stores";
    import { success } from "../../js/toasts";

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

    function getDynalistLogo() {
        return `
            <img
                alt="Dynalist logo"
                class="max-w-8 my-1 mx-0"
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciICB2aWV3Qm94PSIwIDAgNDggNDgiIHdpZHRoPSI0OHB4IiBoZWlnaHQ9IjQ4cHgiPjxwYXRoIGZpbGw9IiMwMDdjZTYiIGQ9Ik02LDEwYzAtMi4yMDksMS43OTEtNCw0LTRoMjhjMi4yMDksMCw0LDEuNzkxLDQsNHYyOGMwLDIuMjA5LTEuNzkxLDQtNCw0SDEwYy0yLjIwOSwwLTQtMS43OTEtNC00CVYxMHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMzEuOTQ5LDE2LjVjLTMuNTc2LDAtNi4yNzUsMi40ODMtNy45NDgsNC42NDNjLTEuNjczLTIuMTU5LTQuMzc0LTQuNjQzLTcuOTQ5LTQuNjQzCUMxMS44ODgsMTYuNSw4LjUsMTkuODY0LDguNSwyNHMzLjM4OCw3LjUsNy41NTEsNy41YzMuNTc2LDAsNi4yNzYtMi40ODMsNy45NDktNC42NDNjMS42NzMsMi4xNiw0LjM3Miw0LjY0Myw3Ljk0OCw0LjY0MwljNC4xNjMsMCw3LjU1MS0zLjM2NCw3LjU1MS03LjVTMzYuMTEyLDE2LjUsMzEuOTQ5LDE2LjV6IE0yMS45OTIsMjQuMjI2Yy0xLjA0OSwxLjUzNy0zLjIxNSw0LjExNi01Ljk0MSw0LjExNgljLTIuNDExLDAtNC4zNzItMS45NDgtNC4zNzItNC4zNDJjMC0yLjM5NCwxLjk2MS00LjM0Miw0LjM3Mi00LjM0MmMyLjcwNCwwLDQuODgzLDIuNTg0LDUuOTQsNC4xMjRsMC4xNTIsMC4yMjJMMjEuOTkyLDI0LjIyNnogTTMxLjk0OSwyOC4zNDJjLTIuNzI2LDAtNC44OTItMi41NzktNS45NDEtNC4xMTZsLTAuMTUyLTAuMjIybDAuMTUyLTAuMjIyYzEuMDU4LTEuNTQsMy4yMzYtNC4xMjQsNS45NDEtNC4xMjQJYzIuNDExLDAsNC4zNzIsMS45NDgsNC4zNzIsNC4zNDJDMzYuMzIxLDI2LjM5NCwzNC4zNTksMjguMzQyLDMxLjk0OSwyOC4zNDJ6Ii8+PC9zdmc+"
            />
        `;
    }
</script>

<div class="dynalistPrompt">
    <div class="flex h-auto items-center space-x-1">
        {@html getDynalistLogo()}
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
