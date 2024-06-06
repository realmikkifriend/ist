<script>
    import Markdown from "svelte-exmarkdown";
    export let comments;
</script>

<div class="prose mx-auto w-11/12 rounded-b-2xl bg-accent p-4">
    {#each comments as comment, i}
        <Markdown md={comment.content} />
        {#if i < comments.length - 1}
            <div class="divider my-1" />
        {/if}
    {/each}
</div>
