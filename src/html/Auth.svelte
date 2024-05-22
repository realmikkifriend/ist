<script>
    import { onMount, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { todoistAccessToken } from "../js/stores";
    import { SvelteToast } from "@zerodevx/svelte-toast";
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
    }
</style>
