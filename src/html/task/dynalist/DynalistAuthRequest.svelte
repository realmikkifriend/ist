<script>
    import { ArrowPathIcon, KeyIcon } from "@krowten/svelte-heroicons";
    import { dynalistAccessToken } from "../../../js/stores";
    import { success } from "../../../js/toasts";
    import Logo from "../../Logo.svelte";
    import { validateDynalistToken } from "./dynalistApi";

    async function handleToken(event) {
        event.preventDefault();

        const form = event.target;
        const tempToken = form.elements.token.value;

        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        const spinner = form.querySelector(".spinner");
        if (spinner) spinner.style.display = "inline-block";

        const submitContent = form.querySelector(".submit-content");
        if (submitContent) submitContent.style.display = "none";

        const invalidToken = form.parentElement.querySelector(".invalid-token");
        if (invalidToken) invalidToken.style.display = "none";

        const result = await validateDynalistToken(tempToken);
        if (result.success) {
            success("Dynalist access token set!");
            dynalistAccessToken.set(tempToken);
        } else {
            if (invalidToken) invalidToken.style.display = "block";
        }

        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.style.display = "none";
        if (submitContent) submitContent.style.display = "flex";
    }
</script>

<div class="dynalistPrompt w-full">
    <div class="flex h-auto items-center space-x-1">
        <Logo type="dynalist" size={8} />
        <div class="overflow-x-hidden text-nowrap">
            Provide <a
                href="https://dynalist.io/developer"
                class="href text-blue-500 hover:underline">Dynalist access</a
            >
            <p class="invalid-token text-red-500" style="display:none;">Invalid token</p>
        </div>
    </div>
    <form class="flex gap-2" on:submit={handleToken}>
        <input
            type="text"
            name="token"
            placeholder="Enter your token"
            class="input min-w-4 flex-grow"
        />
        <span class="submit-content" style="display:flex;">
            <button
                type="submit"
                class="btn flex-grow-0 bg-primary text-white hover:bg-primary hover:opacity-75"
                ><KeyIcon class="h-5 w-5" /></button
            >
        </span>
        <span class="spinner" style="display:none;">
            <ArrowPathIcon class="h-6 w-6 animate-spin" />
        </span>
    </form>
</div>
