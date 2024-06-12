<script>
    import Markdown from "svelte-exmarkdown";
    export let content;

    function parseContent(content) {
        return content.split("\n").map((item) => item.substring(2).trim());
    }

    const checklistItems = parseContent(content);
</script>

{#each checklistItems as item}
    <Markdown md={item} />
{/each}
