<script>
    import { onMount } from "svelte";
    import Markdown from "svelte-exmarkdown";
    import DynalistComment from "./dynalist/DynalistComment.svelte";
    import DynalistAuthRequest from "./dynalist/DynalistAuthRequest.svelte";
    import { dynalistAccessToken } from "../../js/stores";
    export let comments;

    let accessToken,
        requiresAuthRequest = false;

    $: accessToken = $dynalistAccessToken;

    onMount(() => {
        requiresAuthRequest = comments.some((comment) =>
            comment.content.startsWith("https://dynalist.io/d/"),
        );
    });
</script>

<div class="prose mx-auto w-11/12 rounded-b-2xl bg-accent p-4 text-primary-content">
    {#if requiresAuthRequest && !accessToken}
        <DynalistAuthRequest />
        <div class="divider my-1" />
    {/if}

    {#each comments as comment, i}
        {#if comment.content.startsWith("https://dynalist.io/d/")}
            {#if accessToken}
                <DynalistComment url={comment.content} {accessToken} />
            {:else}
                Dynalist URL detected but no access code stored.
            {/if}
        {:else}
            <Markdown md={comment.content} />
        {/if}

        {#if i < comments.length - 1}
            <div class="divider relative z-10 my-1" />
        {/if}
    {/each}
</div>
