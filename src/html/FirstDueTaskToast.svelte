<script lang="ts">
    export let onClick: (() => void) | undefined;

    /**
     * Function to pass a click on the toast.
     */
    export function handleClick() {
        if (typeof onClick === "function") {
            onClick();
        }
    }
</script>

<button on:click={handleClick}>First due task has changed! Click here to update...</button>
