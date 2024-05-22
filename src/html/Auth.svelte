<script>
    import { onMount, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { todoistAccessToken } from "../js/stores";
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
</script>

{#if !accessToken}
    {#if window.location.search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App />
{/if}
