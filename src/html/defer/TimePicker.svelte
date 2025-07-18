<script>
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { DateTime } from "luxon";
    import { createDateWithTime } from "../../js/time";
    import { getPriorityClasses } from "../../js/classes";
    import createButtons from "./deferButtons"; // Import the function

    export let task, tasks;

    let buttons = createButtons();

    const updateMilliseconds = () => {
        buttons = createButtons();

        const tomorrowDate = DateTime.now().plus({ days: 1 }),
            result = createDateWithTime(task.due.string, tomorrowDate),
            now = DateTime.now();

        if (result.newDate === null) {
            buttons[0].text = "";
            buttons[0].ms = 0;
        } else {
            const tomorrow = result.newDate,
                extractedTime = result.extractedTime,
                tomorrowInMS = tomorrow.diff(now).milliseconds;

            buttons[0].text = `tomorrow ${extractedTime}`;
            buttons[0].ms = tomorrowInMS;
        }

        let soonTasks = tasks.filter((task) => {
            let dueDateTime = DateTime.fromISO(task.due.date);
            return (
                dueDateTime.isValid &&
                task.due.date.includes("T") &&
                dueDateTime.diffNow("hours").hours <= 25
            );
        });

        for (let i = 1; i < buttons.length; i++) {
            let futureTime = now.plus({ milliseconds: buttons[i].ms });
            let nextFutureTime =
                i + 1 < buttons.length ? now.plus({ milliseconds: buttons[i + 1].ms }) : null;
            let isTomorrow = now.startOf("day").toMillis() !== futureTime.startOf("day").toMillis();
            let timeFormat = futureTime.toFormat("h:mm a");
            buttons[i].time = isTomorrow ? `<i>${timeFormat}</i>` : timeFormat;

            let matchedTasks = [];
            soonTasks = soonTasks.filter((task) => {
                let dueDateTime = DateTime.fromISO(task.due.date);
                const isWithinFutureTime = nextFutureTime ? dueDateTime < nextFutureTime : true;
                const isValidTime = i === 1 ? dueDateTime >= now : dueDateTime >= futureTime;
                if (isWithinFutureTime && isValidTime) {
                    matchedTasks.push(task);
                    return false;
                }

                return true;
            });

            Object.assign(buttons[i], { count: 0, priority: 0 });

            const count = matchedTasks.length > 0 ? matchedTasks.length : "",
                priority =
                    matchedTasks.length > 0
                        ? Math.max(...matchedTasks.map((task) => task.priority))
                        : "";

            buttons[i].count = count;
            buttons[i].priority = priority;
        }
    };

    onMount(() => {
        updateMilliseconds();
    });

    const interval = setInterval(updateMilliseconds, 30000);

    onDestroy(() => {
        clearInterval(interval);
    });

    const dispatch = createEventDispatcher();

    const handleDefer = (rawTime) => {
        dispatch("defer", { rawTime });
    };
</script>

<div class="mt-2 flex w-72 flex-row flex-wrap gap-x-2 gap-y-1">
    {#each buttons as { text, ms, styling, stylingButton, time, count, priority }}
        <div class={styling}>
            <button
                class="btn min-h-4 w-full rounded-md px-1 hover:bg-secondary {stylingButton}"
                on:click={() => handleDefer(ms)}
                >{text}
            </button>
            {#if time}
                <div class="flex max-h-4 w-full justify-between overflow-hidden text-xs opacity-65">
                    <span class="w-fit overflow-hidden text-left text-secondary">{@html time}</span>
                    <span
                        class="badge badge-xs mt-0.5 w-fit overflow-hidden text-right font-bold {getPriorityClasses(
                            priority,
                        )}">{count}</span
                    >
                </div>
            {/if}
        </div>
    {/each}
</div>
