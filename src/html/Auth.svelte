<script lang="ts">
    import { todoistAccessToken } from "../stores/secret";
    import "@fontsource/clear-sans/400.css";
    import "@fontsource/clear-sans/700.css";
    import "../styles/styles.css";
    import OAuthCallback from "./OAuthCallback.svelte";
    import LandingPage from "./Landing.svelte";
    import AppStateMutators from "./AppStateMutators.svelte";

    const isBrowser = typeof window !== "undefined";
    const search = isBrowser ? window.location.search : "";

    $effect(() => {
        if (isBrowser && search.startsWith("?code") && $todoistAccessToken) {
            window.history.pushState({ path: "/" }, "", "/");
        }
    });
</script>

{#if !$todoistAccessToken}
    {#if isBrowser && search.startsWith("?code")}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <AppStateMutators />
{/if}
