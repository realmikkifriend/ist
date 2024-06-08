<script>
    import { dynalistAccessToken } from "../js/stores";
    export let comment;

    let accessToken;

    dynalistAccessToken.subscribe(($) => {
        accessToken = $;
    });
</script>

{#if accessToken}
    <p>access token is set</p>
    {comment}
{:else}
    <p class="dynalistPrompt">
        Provide <a href="https://dynalist.io/developer" class="href">Dynalist access token</a>...
        <input type="text" placeholder="" class="input w-full max-w-xs" />
    </p>
{/if}
