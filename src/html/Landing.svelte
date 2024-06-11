<script>
    import { getTodoistLogo } from "../js/logos";
    import Footer from "./Footer.svelte";

    const TODOIST_CLIENT_ID = process.env.TODOIST_CLIENT_ID;
    let todoistAuthURL = `https://todoist.com/oauth/authorize?client_id=${TODOIST_CLIENT_ID}&scope=data:read_write&state=${crypto.randomUUID()}`;
</script>

<div class="hero py-6 md:py-20" id="landing">
    <div class="hero-content text-center">
        <div class="max-w-lg" aria-label="Quick Explanation">
            <h1 class="text-5xl font-bold">One Task at a Time</h1>
            <p class="py-6">
                Ist is a micro-app that reads your task list from Todoist and displays the most
                important task that can currently be worked on.
            </p>
            <div>
                <a class="btn btn-outline btn-primary items-center text-lg" href={todoistAuthURL}>
                    {@html getTodoistLogo()}
                    <p class="pb-1">Continue with Todoist</p>
                </a>
            </div>
        </div>
    </div>
</div>
<div class="absolute bottom-0 w-[99%]">
    <Footer />
</div>
