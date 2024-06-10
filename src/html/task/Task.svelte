<script>
    import { createEventDispatcher } from "svelte";
    import { CheckIcon, CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    import DeferModal from "../defer/DeferModal.svelte";
    import Comments from "./Comments.svelte";
    import { getPriorityClass } from "../../js/priority";

    export let task;

    const dispatch = createEventDispatcher();
    let modal;

    const handleDone = () => {
        dispatch("done", { task });
    };

    const handleDefer = ({ detail: { task, time } }) => {
        modal.close();
        dispatch("defer", { task, time });
    };
</script>

<div class="mx-auto mt-12 max-w-72 sm:mt-8 sm:max-w-sm">
    <div class="card mt-0 bg-neutral text-primary-content">
        <div class="card-body">
            <h2 class="card-title text-3xl">{task.content}</h2>
            <div class="card-actions justify-center">
                <div class="badge self-center font-bold {getPriorityClass(task.priority)}">
                    {task.priority}
                </div>
                <button
                    class="text-md btn btn-primary h-8 min-h-8 content-center p-4"
                    title={task.due.string ? `repeats ${task.due.string}` : "one-time task"}
                    on:click={handleDone}><CheckIcon class="h-5 w-5 [&>path]:stroke-[3]" /></button
                >
                <button
                    class="text-md btn btn-secondary h-8 min-h-8 content-center p-4"
                    on:click={() => modal.showModal()}
                >
                    {#if task.due.all_day == 1}
                        <CalendarIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    {:else}
                        <ClockIcon class="h-5 w-5 [&>path]:stroke-[3]" />
                    {/if}
                </button>
            </div>
        </div>
    </div>
    {#if task.notes?.length}
        <Comments comments={task.notes} />
    {/if}
</div>

<dialog id="defer_modal" class="modal" bind:this={modal}>
    <DeferModal {task} on:defer={handleDefer} />
</dialog>
