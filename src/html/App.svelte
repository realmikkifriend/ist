<script>
    import { onMount } from 'svelte';
    import Cookies from 'js-cookie';
    import '../css/styles.css';
    import LandingPage from './Landing.svelte';
    import OAuthCallback from './OAuthCallback.svelte';

    let todoistAccessToken = Cookies.get('todoist_access_token');
</script>

{#if !todoistAccessToken}
    {#if window.location.search.slice(0, 5) === '?code'}
        <OAuthCallback />
    {:else}
        <LandingPage />
    {/if}
{:else}
    <p>This appears when logged in</p>
{/if}
