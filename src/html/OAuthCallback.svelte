<script lang="ts">
    import { onMount } from "svelte";
    import { getAuthToken } from "@doist/todoist-sdk";
    import { todoistAccessToken } from "../stores/secret";

    const TODOIST_CLIENT_ID: string | undefined = process.env.TODOIST_CLIENT_ID;
    const TODOIST_CLIENT_SECRET: string | undefined = process.env.TODOIST_CLIENT_SECRET;

    // The dev server injects a `window.process` polyfill into index.html (the
    // production build statically replaces `process.env.*` instead), so the
    // global's presence marks the local Vite server, which proxies /oauth to
    // todoist.com. On a static production deploy there is no proxy, so the
    // exchange must call Todoist directly (its token endpoint sends CORS
    // headers for any origin).
    const TOKEN_BASE_URL =
        typeof process === "object" ? window.location.origin : "https://todoist.com";

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
        return getAuthToken({ clientId, clientSecret, code }, { baseUrl: TOKEN_BASE_URL })
            .then(({ accessToken }) => {
                todoistAccessToken.set(accessToken);
            })
            .catch((error: unknown) => {
                console.error("Failed to exchange code for token", error);
            });
    }
</script>

<div class="hero">Authenticating...</div>
