<script>
    import { onDestroy } from "svelte";
    import { SvelteToast } from "@zerodevx/svelte-toast";
    import { todoistAccessToken } from "../js/stores";
    import "@fontsource/clear-sans/400.css";
    import "@fontsource/clear-sans/700.css";
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

<SvelteToast target="wait" />
<SvelteToast target="success" />
{#if !accessToken}
    {#if window.location.search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App />
{/if}
