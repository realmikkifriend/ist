<script lang="ts">
    import { onMount } from "svelte";
    import { todoistAccessToken } from "../stores/secret";

    const TODOIST_CLIENT_ID: string | undefined = process.env.TODOIST_CLIENT_ID;
    const TODOIST_CLIENT_SECRET: string | undefined = process.env.TODOIST_CLIENT_SECRET;
    const TODOIST_REDIRECT_URI: string | undefined = process.env.TODOIST_REDIRECT_URI;

    onMount((): void => {
        if (!TODOIST_CLIENT_ID || !TODOIST_CLIENT_SECRET || !TODOIST_REDIRECT_URI) {
            console.error("Missing environment variables for Todoist OAuth");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
            void exchangeCodeForToken(code);
        } else {
            console.error("No code found in URL parameters");
        }
    });

    /**
     * Extracts the access token from a JSON object.
     * @param json - The JSON object to extract the token from.
     * @returns The access token, or undefined if it's not found or invalid.
     */
    function getAccessToken(json: unknown): string | undefined {
        if (
            typeof json === "object" &&
            json !== null &&
            "access_token" in json &&
            typeof json.access_token === "string"
        ) {
            return json.access_token;
        }
        return undefined;
    }

    /**
     * Exchanges the authorization code for a Todoist access token and stores it.
     * @param code - The authorization code from the OAuth callback.
     */
    async function exchangeCodeForToken(code: string): Promise<void> {
        const response = await fetch("https://todoist.com/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: TODOIST_CLIENT_ID,
                client_secret: TODOIST_CLIENT_SECRET,
                code,
                redirect_uri: TODOIST_REDIRECT_URI,
            }),
        }).catch((error) => {
            console.error("An error occurred while exchanging code for token", error);
            return null;
        });

        if (!response || !response.ok) {
            console.error(`HTTP error! Status: ${response ? response.status : "no response"}`);
            return;
        }

        const json: unknown = await response.json();
        const accessToken = getAccessToken(json);

        if (accessToken) {
            todoistAccessToken.set(accessToken);
        } else {
            console.error("Failed to exchange code for token", json);
        }
    }
</script>

<div class="hero">Authenticating...</div>
