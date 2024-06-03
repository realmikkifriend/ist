<script>
    import { createEventDispatcher } from "svelte";
    export let task;

    const dispatch = createEventDispatcher();

    const handleDefer = (ms) => {
        dispatch("defer", { task, ms });
    };
</script>

<div class="modal-box">
    <h3 class="text-lg font-bold">Defer Task</h3>
    <p class="py-4">Choose a new due date for the task.</p>
    <div class="modal-action">
        <button class="btn" on:click={() => handleDefer(24 * 60 * 60 * 1000)}>1 Day</button>
        <button class="btn" on:click={() => handleDefer(3 * 24 * 60 * 60 * 1000)}>3 Days</button>
        <button class="btn" on:click={() => handleDefer(7 * 24 * 60 * 60 * 1000)}>1 Week</button>
    </div>
</div>
<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
