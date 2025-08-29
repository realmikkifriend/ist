<script lang="ts">
    import { toastMessages } from "../../stores/interface";
    import { fly } from "svelte/transition";
    import type { ToastMessage } from "../../types/interface";
    import { clearToasts } from "../../services/toastService";

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
            class="alert {alertClass} flex h-11 cursor-pointer flex-col items-start gap-0.5 p-2"
            onclick={() => {
                if (toast.action) {
                    toast.action();
                }
                clearToasts(toast.id);
            }}
            type="button"
            in:fly={{ x: 200, duration: 300 }}
            out:fly={{ x: 200, duration: 300 }}
        >
            <span>{toast.message}</span>
            <progress class="progress h-1 w-54 opacity-50" max="100" value={toast.progress}
            ></progress>
        </button>
    {/each}
</div>
