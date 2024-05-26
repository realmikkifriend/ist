<script>
    import { createEventDispatcher } from "svelte";
    import { CheckIcon } from "@krowten/svelte-heroicons";
    export let task;

    const dispatch = createEventDispatcher();

    const priorityClasses = {
        1: "bg-priority-1 text-white",
        2: "bg-priority-2 text-white",
        3: "bg-priority-3 text-white",
        4: "bg-priority-4 text-white",
    };

    const getPriorityClasses = (priority) => {
        return priorityClasses[priority] || "";
    };

    const handleDone = () => {
        dispatch("done", { task });
    };
</script>

<div class="card mx-auto mt-8 max-w-sm bg-neutral text-primary-content">
    <div class="card-body">
        <h2 class="card-title text-2xl">{task.content}</h2>
        <div class="card-actions justify-center">
            <div class={`badge self-center font-bold ${getPriorityClasses(task.priority)}`}>
                {task.priority}
            </div>
            <button
                class="text-md btn btn-primary h-8 min-h-8 content-center p-4"
                on:click={handleDone}><CheckIcon class="h-5 w-5  [&>path]:stroke-[4]" /></button
            >
        </div>
    </div>
</div>
