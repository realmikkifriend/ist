<script lang="ts">
    import { Icon, ArrowPath, Key } from "svelte-hero-icons";
    import { dynalistAccessToken } from "../../../js/stores";
    import { success } from "../../../js/toasts";
    // @ts-expect-error until file is converted to TypeScript
    import Logo from "../../Logo.svelte";
    import { validateDynalistToken } from "./dynalistApi";
    import type { ValidateDynalistTokenResult } from "../../../../types/dynalist";

    /**
     * Handles the submission of the Dynalist access token form.
     * Validates the token and updates the UI based on the result.
     * @param event - The form submit event
     */
    async function handleToken(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        const form = event.target as HTMLFormElement;
        const tokenElement = form.elements.namedItem("token");
        let tempToken = "";
        if (tokenElement instanceof HTMLInputElement) {
            tempToken = tokenElement.value;
        }

        const submitBtn = form.querySelector("button[type='submit']");
        if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = true;

        const spinner = form.querySelector(".spinner");
        if (spinner instanceof HTMLElement) spinner.style.display = "inline-block";

        const submitContent = form.querySelector(".submit-content");
        if (submitContent instanceof HTMLElement) submitContent.style.display = "none";

        const invalidToken = form.parentElement?.querySelector(
            ".invalid-token",
        ) as HTMLParagraphElement | null;
        if (invalidToken) invalidToken.style.display = "none";

        const result: ValidateDynalistTokenResult = await validateDynalistToken(tempToken);
        if (result.success) {
            success("Dynalist access token set!");
            dynalistAccessToken.set(tempToken);
        } else {
            if (invalidToken) invalidToken.style.display = "block";
        }

        if (submitBtn instanceof HTMLButtonElement) submitBtn.disabled = false;
        if (spinner instanceof HTMLElement) spinner.style.display = "none";
        if (submitContent instanceof HTMLElement) submitContent.style.display = "flex";
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
                ><Icon src={Key} class="h-5 w-5" /></button
            >
        </span>
        <span class="spinner" style="display:none;">
            <Icon src={ArrowPath} class="h-6 w-6 animate-spin" />
        </span>
    </form>
</div>
