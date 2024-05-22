<script>
    const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
    let todoistAuthURL = `https://todoist.com/oauth/authorize?client_id=${TODOIST_CLIENT_ID}&scope=data:read_write&state=${crypto.randomUUID()}`;
</script>

<div class="hero py-24">
    <div class="hero-content text-center">
        <div class="max-w-lg">
            <h1 class="text-5xl font-bold">One Task at a Time</h1>
            <p class="py-6">
                Ist is a micro-app that reads your task list from Todoist and displays the most
                important task that can currently be worked on.
            </p>
            <div>
                <a class="btn btn-primary" href={todoistAuthURL}>Log In</a>
            </div>
        </div>
    </div>
</div>
