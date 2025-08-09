<script lang="ts">
    import { shortcut } from "@svelte-put/shortcut";
    import { todoistAccessToken } from "../stores/secret";
    import "@fontsource/clear-sans/400.css";
    import "@fontsource/clear-sans/700.css";
    import App from "./App.svelte";
    import LandingPage from "./Landing.svelte";
    import OAuthCallback from "./OAuthCallback.svelte";
    import "../css/styles.css";

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
    <App />
{/if}

<svelte:window
    use:shortcut={{
        trigger: {
            key: "?",
            callback: () => {
                document.body.classList.toggle("show-kbd");
            },
            modifier: "shift",
        },
    }}
/>
