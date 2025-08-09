<script lang="ts">
    import { Icon, ArrowPath, Key } from "svelte-hero-icons";
    import { dynalistAccessToken } from "../../../stores/secret";
    import { success } from "../../../services/toastService";
    import Logo from "../../interface/Logo.svelte";
    import { validateDynalistToken } from "../../../utils/dynalistApiGetUtils";
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
        <Logo size={8} type="dynalist" />
        <div class="overflow-x-hidden text-nowrap">
            Provide <a
                class="href text-blue-500 hover:underline"
                href="https://dynalist.io/developer">Dynalist access</a
            >
            <p class="invalid-token invisible text-red-500">Invalid token</p>
        </div>
    </div>
    <form class="flex gap-2" onsubmit={handleToken}>
        <input name="token" class="input min-w-4 grow" placeholder="Enter your token" type="text" />
        <span class="submit-content flex">
            <button
                class="btn bg-primary hover:bg-primary grow-0 text-white hover:opacity-75"
                type="submit"><Icon class="h-5 w-5" src={Key} /></button
            >
        </span>
        <span class="spinner invisible">
            <Icon class="h-6 w-6 animate-spin" src={ArrowPath} />
        </span>
    </form>
</div>
