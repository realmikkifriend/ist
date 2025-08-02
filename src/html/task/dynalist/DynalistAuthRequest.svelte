<script lang="ts">
    import { Icon, ArrowPath, Key } from "svelte-hero-icons";
    import { dynalistAccessToken } from "../../../stores/stores";
    import { success } from "../../../services/toastService";
    import Logo from "../../Logo.svelte";
    import { validateDynalistToken } from "./dynalistApi";
    import type { ValidateDynalistTokenResult } from "../../../types/dynalist";

    /**
     * Handles the submission of the Dynalist access token form.
     * Validates the token and updates the UI based on the result.
     * @param event - The form submit event
     */
    async function handleToken(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        const form = event.target as HTMLFormElement;
        const tokenElement = form.elements.namedItem("token");
        const submitBtn = form.querySelector("button[type='submit']");
        const spinner = form.querySelector(".spinner");
        const submitContent = form.querySelector(".submit-content");
        const invalidTokenMsg = form.parentElement?.querySelector(".invalid-token");

        const setLoadingState = (loading: boolean) => {
            if (submitBtn instanceof HTMLButtonElement) {
                submitBtn.disabled = loading;
            }
            if (spinner instanceof HTMLElement) {
                spinner.style.display = loading ? "inline-block" : "none";
            }
            if (submitContent instanceof HTMLElement) {
                submitContent.style.display = loading ? "none" : "flex";
            }
        };

        const showInvalidTokenMessage = (show: boolean) => {
            if (invalidTokenMsg instanceof HTMLParagraphElement) {
                invalidTokenMsg.style.display = show ? "block" : "none";
            }
        };

        const token = tokenElement instanceof HTMLInputElement ? tokenElement.value : "";

        setLoadingState(true);
        showInvalidTokenMessage(false);

        const result: ValidateDynalistTokenResult = await validateDynalistToken(token);

        if (result.success) {
            success("Dynalist access token set!");
            dynalistAccessToken.set(token);
            if (tokenElement instanceof HTMLInputElement) {
                tokenElement.value = "";
            }
        } else {
            showInvalidTokenMessage(true);
        }

        setLoadingState(false);
    }
</script>

<div class="dynalistPrompt w-full">
    <div class="mb-1 flex items-center space-x-1">
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
        <input type="text" name="token" placeholder="Enter your token" class="input min-w-4 grow" />
        <span class="submit-content" style="display:flex;">
            <button
                type="submit"
                class="btn bg-primary hover:bg-primary grow-0 text-white hover:opacity-75"
                ><Icon src={Key} class="h-5 w-5" /></button
            >
        </span>
        <span class="spinner" style="display:none;">
            <Icon src={ArrowPath} class="h-6 w-6 animate-spin" />
        </span>
    </form>
</div>
