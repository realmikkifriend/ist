<script>
    import { createEventDispatcher } from "svelte";
    import { CheckIcon, CalendarIcon, ClockIcon, ForwardIcon } from "@krowten/svelte-heroicons";
    import DeferModal from "../defer/DeferModal.svelte";
    import Comments from "./Comments.svelte";
    import { getPriorityBorder } from "../../js/classes";

    export let task;

    const dispatch = createEventDispatcher();
    let modal;

    const handleDone = () => {
        if (task.summoned) window.location.hash = task.summoned;
        dispatch("done", { task });
    };

    const handleDefer = ({ detail: { task, time } }) => {
        modal.close();
        if (task.summoned) window.location.hash = task.summoned;
        dispatch("defer", { task, time });
    };

    const handleSkip = () => {
        // TODO: add skip task logic here
    };
</script>

<div class="mx-auto mt-4 max-w-72 sm:mt-2 sm:max-w-sm">
    <div
        class="card mt-0 rounded-xl border-b-[0.75rem] border-opacity-50 {getPriorityBorder(
            task.priority,
        )} bg-neutral text-primary-content"
    >
        <div class="card-body pb-7">
            <h2 class="card-title text-center text-3xl">{task.content}</h2>
            <div class="card-actions justify-center">
                {#if task.skip}
                    <button
                        class="text-md btn btn-ghost btn-sm h-8 min-h-8 content-center p-4"
                        title="skip task"
                        on:click={handleSkip}
                    >
                        <ForwardIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    </button>
                {:else}
                    <button
                        class="text-md btn btn-primary h-8 min-h-8 content-center p-4"
                        title={task.due.string ? `repeats ${task.due.string}` : "one-time task"}
                        on:click={handleDone}
                    >
                        <CheckIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    </button>
                {/if}
                <button
                    class="text-md btn btn-secondary h-8 min-h-8 content-center p-4"
                    on:click={() => modal.showModal()}
                >
                    {#if task.due.allDay === 1}
                        <CalendarIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    {:else}
                        <ClockIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {#if task.comments}
        <Comments comments={task.comments} />
    {/if}
</div>

<dialog id="defer_modal" class="modal" bind:this={modal}>
    <DeferModal {task} on:defer={handleDefer} />
</dialog>
