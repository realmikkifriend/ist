<script>
    import { onMount } from "svelte";
    import { todoistAccessToken } from "../js/stores";

    const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID,
        TODOIST_CLIENT_SECRET = process.env.TODOIST_CLIENT_SECRET,
        TODOIST_REDIRECT_URI = process.env.TODOIST_REDIRECT_URI;

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
        });

        const data = await response.json();
        if (data.access_token) {
            todoistAccessToken.set(data.access_token);
            window.location.href = "/";
        } else {
            console.error("Failed to exchange code for token", data);
        }
    }

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search),
            code = urlParams.get("code");
        exchangeCodeForToken(code);
    });
</script>

<div class="hero">Authenticating...</div>
