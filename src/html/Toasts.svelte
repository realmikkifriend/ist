<script lang="ts">
    import { toastMessages } from "../stores/interface";
    import { fly } from "svelte/transition";
    import type { ToastMessage } from "../types/interface";
    import { removeToast } from "../services/toastService";

    const alertClasses: Record<ToastMessage["type"], string> = {
        info: "alert-info",
        success: "alert-success",
        error: "alert-error",
    };
</script>

<div class="toast toast-end toast-bottom z-50 mb-8">
    {#each $toastMessages as toast (toast.id)}
        {@const alertClass = alertClasses[toast.type]}
        <button
            in:fly={{ x: 200, duration: 300 }}
            out:fly={{ x: 200, duration: 300 }}
            class="alert {alertClass} cursor-pointer"
            on:click={() => {
                if (toast.action) {
                    toast.action();
                }
                removeToast(toast.id);
            }}
        >
            <span>{toast.message}</span>
        </button>
    {/each}
</div>
