<script>
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { getPriorityClass } from "../../js/priority";
    export let task, tz, items;

    let calendarElement, valueDefault;

    let tomorrow = DateTime.now().setZone(tz).plus({ days: 1 });
    let tomorrowStr = tomorrow.toISODate();

    function updateCalendarCells() {
        if (!calendarElement) return;

        const cal = calendarElement.querySelector(".std-btn-header.sdt-toggle-btn").innerText;
        const now = DateTime.local().setZone(tz);
        const startOfMonth = DateTime.fromFormat(cal, "MMMM yyyy").startOf("month");
        const start =
            cal === now.toFormat("MMMM yyyy") ? now.plus({ days: 1 }).startOf("day") : startOfMonth;
        const end = startOfMonth.endOf("month");

        let soonTasks = items.filter((item) => {
            const dueDate = DateTime.fromISO(item.due.date).setZone(tz);
            return dueDate >= start && dueDate <= end && item.context_id === task.context_id;
        });

        const calendarCells = calendarElement.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

        calendarCells.forEach((cell) => {
            cell.querySelector(".dot-container")?.remove();

            if (cell.querySelector("button[disabled]")) return;

            const cellDate = cell.textContent.trim();
            const tasksForCellDate = soonTasks.filter(
                (task) => new Date(task.due.date).getDate() == cellDate,
            );

            const highestPriority = Math.max(...tasksForCellDate.map((task) => task.priority));

            const dotContainer = document.createElement("div");
            dotContainer.className =
                "dot-container flex space-x-0.5 justify-center items-center h-1 mt-[-0.5rem]";

            const elements = tasksForCellDate.slice(0, 4).map((task, index) => {
                const div = document.createElement("div");
                if (index < 3) {
                    div.className = `w-1 h-1 rounded-full ${getPriorityClass(highestPriority)}`;
                } else {
                    div.textContent = "+";
                    div.className = `text-[0.65rem] text-secondary h-[1.1rem] w-1 ml-0`;
                }
                return div;
            });
            elements.forEach((element) => dotContainer.appendChild(element));

            cell.appendChild(dotContainer);
        });
    }

    afterUpdate(updateCalendarCells);

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: rawTime }) => {
        valueDefault = undefined;
        dispatch("defer", { rawTime });
    };
</script>

<button bind:this={calendarElement} on:click={updateCalendarCells}>
    <SveltyPicker
        bind:value={valueDefault}
        startDate={tomorrowStr}
        pickerOnly="true"
        mode="date"
        todayBtnClasses="display: hidden"
        clearBtnClasses="display: hidden"
        on:change={handleDefer}
    />
</button>
