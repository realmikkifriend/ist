<script>
    import { afterUpdate, createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    import { getPriorityClasses } from "../../js/classes";
    export let taskToDefer, tz, tasks;

    let calendarElement, valueDefault;

    let tomorrow = DateTime.now().setZone(tz).plus({ days: 1 });
    let tomorrowStr = tomorrow.toISODate();

    function updateCalendarCells() {
        if (!calendarElement) return;

        const monthYear = calendarElement.querySelector(".std-btn-header.sdt-toggle-btn").innerText;
        const now = DateTime.local().setZone(tz);
        const startOfMonth = DateTime.fromFormat(monthYear, "MMMM yyyy").startOf("month");
        const start =
            monthYear === now.toFormat("MMMM yyyy")
                ? now.plus({ days: 1 }).startOf("day")
                : startOfMonth;
        const end = startOfMonth.endOf("month");

        let soonTasks = tasks.filter((task) => {
            const dueDate = DateTime.fromISO(task.due.date).setZone(tz);
            return dueDate >= start && dueDate <= end && task.context_id === taskToDefer.context_id;
        });

        const calendarCells = calendarElement.querySelectorAll("td.sdt-cal-td.svelte-hexbpx");

        calendarCells.forEach((cell) => {
            cell.querySelector(".dot-container")?.remove();
            cell.classList.remove("sdt-tomorrow");

            if (cell.querySelector("button[disabled]")) return;

            const cellDate = parseInt(cell.textContent.trim());
            const tomorrowDate = DateTime.now().plus({ days: 1 }).day;
            const isTomorrow = cellDate === tomorrowDate;
            const grayedOut = cell.querySelector("button.not-current");
            const currentMonthDisplayed = monthYear === now.toFormat("MMMM yyyy");
            const nextMonthDisplayed = monthYear === now.plus({ months: 1 }).toFormat("MMMM yyyy");

            if (
                isTomorrow &&
                ((currentMonthDisplayed && !grayedOut) ||
                    (tomorrowDate === 1 && (grayedOut || nextMonthDisplayed)))
            ) {
                cell.classList.add("sdt-tomorrow");
            }

            if (grayedOut) return;

            const tasksForCellDate = soonTasks.filter(
                ({ due }) => DateTime.fromISO(due.date).setZone(tz).day === cellDate,
            );
            tasksForCellDate.sort((a, b) => b.priority - a.priority);

            const dotContainer = document.createElement("div");
            dotContainer.className =
                "dot-container flex space-x-0.5 justify-center items-center h-1 mt-[-0.5rem]";

            const elements = tasksForCellDate.slice(0, 3).map((taskToDefer) => {
                const div = document.createElement("div");
                div.className = `w-1 h-1 rounded-full ${getPriorityClasses(taskToDefer.priority)}`;
                return div;
            });

            if (tasksForCellDate.length > 3) {
                const plusDiv = document.createElement("div");
                plusDiv.textContent = "+";
                plusDiv.className = `text-[0.65rem] text-secondary h-[1.1rem] w-1 ml-0`;
                elements.push(plusDiv);
            }

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
