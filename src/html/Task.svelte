<script>
    import { createEventDispatcher } from "svelte";
    export let task;

    const dispatch = createEventDispatcher();

    const priorityClasses = {
        1: "border-priority-1 text-priority-1",
        2: "border-priority-2 text-priority-2",
        3: "border-priority-3 text-priority-3",
        4: "border-priority-4 text-priority-4",
    };

    const getPriorityClasses = (priority) => {
        return priorityClasses[priority] || "";
    };

    const handleDone = () => {
        dispatch("done", { task });
    };
</script>

<div class="card mx-auto mt-8 max-w-sm bg-primary text-primary-content">
    <div class="card-body">
        <h2 class="card-title">{task.content}</h2>
        <div class="card-actions justify-center">
            <div class={`badge badge-outline self-center ${getPriorityClasses(task.priority)}`}>
                {task.priority}
            </div>
            <button class="primary btn" on:click={handleDone}>done</button>
        </div>
    </div>
</div>
