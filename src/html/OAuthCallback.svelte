<script>
    import { onMount } from "svelte";
    import { todoistAccessToken } from "../js/stores";

    const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
    const TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET;
    const TODOIST_REDIRECT_URI = process.env.TODOIST_REDIRECT_URI;

    onMount(() => {
        if (!TODOIST_CLIENT_ID || !TODOIST_CLIENT_SECRET || !TODOIST_REDIRECT_URI) {
            console.error("Missing environment variables for Todoist OAuth");
            return;
        }

        const urlParams = new URLSearchParams(window.location.search),
            code = urlParams.get("code");

        if (code) {
            exchangeCodeForToken(code);
        } else {
            console.error("No code found in URL parameters");
        }
    });

    async function exchangeCodeForToken(code) {
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

        const data = await response.json();

        data.access_token
            ? todoistAccessToken.set(data.access_token)
            : console.error("Failed to exchange code for token", data);
    }
</script>

<div class="hero">Authenticating...</div>
