<script>
    import { onMount } from "svelte";
    import Cookies from "js-cookie";
    import App from "./App.svelte";
    import LandingPage from "./Landing.svelte";
    import OAuthCallback from "./OAuthCallback.svelte";
    import "../css/styles.css";

    let todoistAccessToken = Cookies.get("todoist_access_token");
</script>

{#if !todoistAccessToken}
    {#if window.location.search.slice(0, 5) === "?code"}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <App {todoistAccessToken} />
{/if}
