<script>
    export let dynalistObject;
</script>

{#if dynalistObject.children}
    <ul>
        {#each dynalistObject.children as child}
            <li>{child.content}</li>
        {/each}
    </ul>
{/if}
