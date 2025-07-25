<script lang="ts">
    import { getAuthStateParameter, getAuthorizationUrl } from "@doist/todoist-api-typescript";
    // @ts-expect-error until file is converted to TypeScript
    import Logo from "./Logo.svelte";
    import Footer from "./Footer.svelte";

    const TODOIST_CLIENT_ID: string | undefined = process.env.TODOIST_CLIENT_ID;

    /**
     * Generates a random state parameter for Todoist OAuth.
     * @returns {string} The generated state parameter.
     */
    const todoistAuthState: string = getAuthStateParameter();

    /**
     * Constructs the Todoist OAuth authorization URL.
     * @returns {string} The authorization URL.
     */
    const todoistAuthURL: string | undefined = TODOIST_CLIENT_ID
        ? getAuthorizationUrl(TODOIST_CLIENT_ID, ["data:read_write"], todoistAuthState)
        : undefined;
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
                {#if todoistAuthURL}
                    <a
                        class="btn btn-outline btn-primary items-center text-lg"
                        href={todoistAuthURL}
                    >
                        <Logo type="todoist" style="max-height: 55%;" />
                        <p class="pb-1">Continue with Todoist</p>
                    </a>
                {:else}
                    <button class="btn btn-outline btn-primary items-center text-lg" disabled>
                        <Logo type="todoist" style="max-height: 55%;" />
                        <p class="pb-1">Todoist Client ID not configured</p>
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>
<div class="absolute bottom-0 w-[99%]">
    <Footer />
</div>
