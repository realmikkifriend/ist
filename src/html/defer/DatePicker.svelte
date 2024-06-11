<script>
    import { onMount, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { getPriorityClass } from "../../js/priority";
    export let task, tz, items;

    let valueDefault;

    let tomorrow = DateTime.now().setZone(tz).plus({ days: 1 });
    let tomorrowStr = tomorrow.toISODate();

    onMount(() => {
        const now = DateTime.local().setZone(tz),
            start = now.plus({ days: 1 }).startOf("day"),
            end = now.endOf("month");

        let soonTasks = items.filter((item) => {
            const dueDate = DateTime.fromISO(item.due.date).setZone(tz);
            return dueDate >= start && dueDate <= end && item.context_id === task.context_id;
        });
        const calendarCells = document.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

        calendarCells.forEach((cell) => {
            const buttonDisabled = cell.querySelector("button[disabled]");
            if (buttonDisabled) return;

            const cellDate = cell.textContent.trim();
            const tasksForCellDate = soonTasks.filter(
                (task) => new Date(task.due.date).getDate() == cellDate,
            );

            const taskCount = tasksForCellDate.length;
            const highestPriority = Math.max(...tasksForCellDate.map((task) => task.priority));

            const dotContainer = document.createElement("div");
            dotContainer.className = "flex justify-center items-center h-1 mt-[-0.5rem]";

            if (taskCount > 0) {
                tasksForCellDate.slice(0, 4).forEach((task, index) => {
                    if (index < 3) {
                        const dot = document.createElement("div");
                        dot.className = `w-1 h-1 rounded-full mr-0.5 ${getPriorityClass(highestPriority)}`;
                        dotContainer.appendChild(dot);
                    } else if (index === 3) {
                        const plus = document.createElement("div");
                        plus.textContent = "+";
                        plus.className = `text-[0.65rem] text-secondary h-[1.1rem] w-1 ml-0`;
                        dotContainer.appendChild(plus);
                    }
                });
            }

            cell.appendChild(dotContainer);
        });
    });

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: rawTime }) => {
        valueDefault = undefined;
        dispatch("defer", { rawTime });
    };
</script>

<SveltyPicker
    bind:value={valueDefault}
    startDate={tomorrowStr}
    pickerOnly="true"
    mode="date"
    todayBtnClasses="display: hidden"
    clearBtnClasses="display: hidden"
    on:change={handleDefer}
/>
