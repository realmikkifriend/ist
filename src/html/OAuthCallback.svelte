<script>
    import { onMount } from "svelte";
    import { todoistAccessToken } from "../js/stores";

    let TODOIST_CLIENT_ID, TODOIST_CLIENT_SECRET, TODOIST_REDIRECT_URI;
    onMount(() => {
        TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
        TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET;
        TODOIST_REDIRECT_URI = process.env.TODOIST_REDIRECT_URI;

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
        try {
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
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.access_token) {
                todoistAccessToken.set(data.access_token);
            } else {
                console.error("Failed to exchange code for token", data);
            }
        } catch (error) {
            console.error("An error occurred while exchanging code for token", error);
        }
    }
</script>

<div class="hero">Authenticating...</div>
