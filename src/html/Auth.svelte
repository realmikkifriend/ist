<script>
    import { onDestroy } from "svelte";
    import { SvelteToast } from "@zerodevx/svelte-toast";
    import { todoistAccessToken } from "../js/stores";
    import "@fontsource/clear-sans";
    import App from "./App.svelte";
    import LandingPage from "./Landing.svelte";
    import OAuthCallback from "./OAuthCallback.svelte";
    import "../css/styles.css";

    let accessToken;
    const unsubscribe = todoistAccessToken.subscribe((value) => {
        accessToken = value;
    });

    onDestroy(() => {
        unsubscribe();
    });

    $: if (window.location.search.startsWith("?code") && accessToken) {
        window.location.href = "/";
    }
</script>

<SvelteToast />
{#if !accessToken}
    {#if window.location.search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App />
{/if}

<style>
    :root {
        --toastContainerTop: auto;
        --toastContainerRight: 1.5rem;
        --toastContainerBottom: 1rem;
        --toastContainerLeft: auto;
        --toastBorderRadius: 0.5rem;
        --toastWidth: 20rem;
    }
</style>
