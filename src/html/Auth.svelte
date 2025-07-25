<script lang="ts">
    import { SvelteToast } from "@zerodevx/svelte-toast";
    import { todoistAccessToken } from "../js/stores";
    import "@fontsource/clear-sans/400.css";
    import "@fontsource/clear-sans/700.css";
    // @ts-expect-error until file is converted to TypeScript
    import App from "./App.svelte";
    import LandingPage from "./Landing.svelte";
    import OAuthCallback from "./OAuthCallback.svelte";
    import "../css/styles.css";

    $: if (window.location.search.startsWith("?code") && $todoistAccessToken) {
        window.history.pushState({ path: "/" }, "", "/");
    }
</script>

<div class="absolute bottom-0 right-0 mb-6 mr-8 flex max-h-fit w-72 flex-col-reverse space-y-1">
    <SvelteToast target="wait" />
    <SvelteToast target="error" />
    <SvelteToast target="success" />
</div>

{#if !$todoistAccessToken}
    {#if window.location.search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App />
{/if}
