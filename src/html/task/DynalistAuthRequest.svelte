<script>
    import { ArrowPathIcon, KeyIcon } from "@krowten/svelte-heroicons";

    let tempToken = "";

    function handleToken(event) {
        event.preventDefault();
        const tokenPattern = /^[a-zA-Z0-9_]+$/;
        if (tempToken && tokenPattern.test(tempToken)) {
            console.log("Valid token");

            // dynalistAccessToken.set(tempToken); // set the new token
        } else {
            console.log("Invalid token");
        }
    }
</script>

<div class="dynalistPrompt">
    Provide <a href="https://dynalist.io/developer" class="href">Dynalist access token</a>...
    <form class="flex w-full gap-2" on:submit={handleToken}>
        <input type="text" placeholder="" class="input flex-grow" bind:value={tempToken} />
        <button
            type="submit"
            class="btn flex-grow-0 bg-primary text-white hover:bg-primary hover:opacity-75"
            ><KeyIcon class="h-5 w-5" /></button
        >
    </form>
</div>
