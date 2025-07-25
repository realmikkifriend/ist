<script lang="ts">
    import Markdown from "svelte-exmarkdown";
    // @ts-expect-error until file is converted to TypeScript
    import DynalistComment from "./dynalist/DynalistComment.svelte";
    // @ts-expect-error until file is converted to TypeScript
    import DynalistAuthRequest from "./dynalist/DynalistAuthRequest.svelte";
    import { dynalistAccessToken } from "../../js/stores";
    import type { Comment } from "../../../types/todoist";

    export let comments: Comment[];

    /**
     * Whether any comment requires a Dynalist auth request.
     */
    $: requiresAuthRequest = comments.some(
        /**
         * Checks if a comment's content starts with a Dynalist URL.
         * @param comment - The comment object to check.
         * @returns True if the comment is a Dynalist URL.
         */
        (comment: Comment): boolean => comment.content.startsWith("https://dynalist.io/d/"),
    );
</script>

<div class="prose mx-auto w-11/12 rounded-b-xl bg-accent p-4 text-primary-content">
    {#if requiresAuthRequest && !$dynalistAccessToken}
        <DynalistAuthRequest />
        <div class="divider my-1" />
    {/if}

    {#each comments as comment, index (index)}
        {#if comment.content.startsWith("https://dynalist.io/d/")}
            {#if $dynalistAccessToken}
                <DynalistComment url={comment.content} />
            {:else}
                Dynalist URL detected but no access code stored.
            {/if}
        {:else}
            <Markdown md={comment.content} />
        {/if}

        {#if index < comments.length - 1}
            <div class="divider relative z-10 my-1" />
        {/if}
    {/each}
</div>
