<script>
    export let onClick;

    export function handleClick() {
        if (typeof onClick === "function") {
            onClick();
        }
    }
</script>

<button on:click={handleClick}>First due task has changed! Click here to update...</button>
