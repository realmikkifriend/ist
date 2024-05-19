<script>
    import { onMount } from 'svelte';
    import Cookies from 'js-cookie';

    const todoistClientID = process.env.TODOIST_CLIENT_ID,
        todoistClientSecret = process.env.TODOIST_CLIENT_SECRET,
        redirectURI = process.env.TODOIST_REDIRECT_URI;

    async function exchangeCodeForToken(code) {
        const response = await fetch('https://todoist.com/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: todoistClientID,
                client_secret: todoistClientSecret,
                code,
                redirect_uri: redirectURI
            })
        });

        const data = await response.json();
        if (data.access_token) {
            Cookies.set('todoist_access_token', data.access_token);
            window.location.href = '/';
        } else {
            console.error('Failed to exchange code for token', data);
        }
    }

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search),
            code = urlParams.get('code');
        exchangeCodeForToken(code);
    });
</script>

<div class="hero">Authenticating...</div>
