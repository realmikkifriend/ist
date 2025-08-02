<script lang="ts">
    import { todoistAccessToken } from "../stores/stores";
    import "@fontsource/clear-sans/400.css";
    import "@fontsource/clear-sans/700.css";
    import App from "./App.svelte";
    import LandingPage from "./Landing.svelte";
    import OAuthCallback from "./OAuthCallback.svelte";
    import "../css/styles.css";

    $: if (window.location.search.startsWith("?code") && $todoistAccessToken) {
        window.history.pushState({ path: "/" }, "", "/");
    }
</script>

{#if !$todoistAccessToken}
    {#if window.location.search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App />
{/if}
