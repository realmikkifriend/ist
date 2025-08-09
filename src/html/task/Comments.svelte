<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import DynalistComment from "./dynalist/DynalistComment.svelte";
    import DynalistAuthRequest from "./dynalist/DynalistAuthRequest.svelte";
    import { dynalistAccessToken } from "../../stores/secret";
    import type { Comment, CommentsProps } from "../../types/todoist";

    let { commentsPromise }: CommentsProps = $props();

    /**
     * Checks provided comments for Dynalist URL.
     * @param comments - Comments to check for URL.
     * @returns Whether any comments contain the URL.
     */
    function hasDynalistUrl(comments: Comment[]): boolean {
        return comments.some((comment) => comment.content.startsWith("https://dynalist.io/d/"));
    }
</script>

<div>
    {#await commentsPromise}
        <div
            class="prose bg-accent text-primary-content mx-auto flex w-11/12 flex-row items-center rounded-b-xl p-4 opacity-25"
        >
            <Icon src={ArrowPath} class="mr-2 h-4 w-4 animate-spin" />
            <p>Loading comments...</p>
        </div>
    {:then comments}
        {#if comments && comments.length > 0}
            <div
                class="prose bg-accent text-primary-content divide-neutral mx-auto flex w-11/12 flex-col gap-y-2 divide-y-3 divide-solid rounded-b-xl p-4"
            >
                {#if hasDynalistUrl(comments) && !$dynalistAccessToken}
                    <DynalistAuthRequest />
                {/if}

                {#each comments as comment, index (index)}
                    {#if comment.content.startsWith("https://dynalist.io/d/")}
                        {#if $dynalistAccessToken}
                            <DynalistComment url={comment.content} />
                        {:else}
                            Dynalist URL detected but no access code stored.
                        {/if}
                    {:else}
                        <SvelteMarkdown source={comment.content} />
                    {/if}
                {/each}
            </div>
        {/if}
    {:catch error}
        <div class="prose bg-accent text-primary-content mx-auto w-11/12 rounded-b-xl p-4">
            <p>Error loading comments: {error.message}</p>
        </div>
    {/await}
</div>
