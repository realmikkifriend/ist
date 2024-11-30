<script>
    import { DateTime } from "luxon";
    import { getPriorityClasses } from "../../js/priority"; // Import the function

    export let task, color;

    const colorClasses = {
        berry_red: "bg-pink-300",
        red: "bg-red-400",
        orange: "bg-orange-500",
        yellow: "bg-yellow-500",
        blue: "bg-blue-500",
        green: "bg-green-500",
        olive_green: "bg-olive-600",
        lime_green: "bg-lime-600",
        mint_green: "bg-green-200",
        teal: "bg-teal-600",
        sky_blue: "bg-sky-blue-600",
        light_blue: "bg-light-blue-600",
        grape: "bg-purple-400",
        violet: "bg-violet-500",
        lavender: "bg-lavender-600",
        magenta: "bg-pink-500",
        salmon: "bg-salmon-600",
        charcoal: "bg-charcoal-600",
        grey: "bg-grey-600",
        taupe: "bg-taupe-600",
    };
</script>

<div
    class={`agenda-task m-1 w-full items-center overflow-hidden whitespace-nowrap rounded-md px-1 text-xs brightness-90 ${colorClasses[color] || "bg-gray-600"}`}
>
    <span
        class="priority-element relative -left-1.5 mt-0 inline-block h-fit min-h-2.5 min-w-4 rounded-md px-1.5 text-xs font-bold {getPriorityClasses(
            task.priority,
        )}"
    >
        {#if task.due.date.includes("T")}
            {DateTime.fromISO(task.due.date).toFormat("h:mm")}
        {/if}
    </span>{task.content}
</div>
