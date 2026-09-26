<script lang="ts">
    import { onMount } from "svelte";
    import { getAuthToken } from "@doist/todoist-sdk";
    import { todoistAccessToken } from "../stores/secret";

    const TODOIST_CLIENT_ID: string | undefined = process.env.TODOIST_CLIENT_ID;
    const TODOIST_CLIENT_SECRET: string | undefined = process.env.TODOIST_CLIENT_SECRET;

    onMount((): void => {
        if (!TODOIST_CLIENT_ID || !TODOIST_CLIENT_SECRET) {
            console.error("Missing environment variables for Todoist OAuth");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            void exchangeCodeForToken(code, TODOIST_CLIENT_ID, TODOIST_CLIENT_SECRET);
        } else {
            console.error("No code found in URL parameters");
        }
    });

    /**
     * Exchanges the authorization code for a Todoist access token and stores it.
     * @param code - The authorization code from the OAuth callback.
     * @param clientId - The registered Todoist OAuth client ID.
     * @param clientSecret - The registered Todoist OAuth client secret.
     * @returns Resolves once the token exchange has completed.
     */
    function exchangeCodeForToken(
        code: string,
        clientId: string,
        clientSecret: string,
    ): Promise<void> {
        return getAuthToken({ clientId, clientSecret, code }, { baseUrl: window.location.origin })
            .then(({ accessToken }) => {
                todoistAccessToken.set(accessToken);
            })
            .catch((error: unknown) => {
                console.error("Failed to exchange code for token", error);
            });
    }
</script>

<div class="hero">Authenticating...</div>
