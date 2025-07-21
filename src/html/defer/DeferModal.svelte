<script>
    import { createEventDispatcher } from "svelte";
    import { writable, derived } from "svelte/store";
    import { CalendarIcon, ClockIcon } from "@krowten/svelte-heroicons";
    import { DateTime } from "luxon";
    import { todoistData } from "../../js/stores";
    import { createDateWithTime } from "../../js/time";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";

    export let task;

    const isTimeTabActive = writable(false);
    $: isTimeTabActive.set(task.due.allDay !== 1);

    const selectTab = (tab) => {
        isTimeTabActive.set(tab === "time");
    };

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

    const tasks = derived(todoistData, ($todoistData) => $todoistData.tasks);

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: { rawTime } }) => {
        isTimeTabActive.set(true);

        const time =
            typeof rawTime === "number"
                ? DateTime.now().setZone(tz).plus({ milliseconds: rawTime })
                : (() => {
                      const date = DateTime.fromISO(rawTime);
                      const tomorrow = DateTime.now().plus({ days: 1 }).setZone(tz);

                      const extracted = createDateWithTime(task.due.string, tomorrow);
                      if (extracted.newDate === null) {
                          return date;
                      } else {
                          const { hour, minute } = extracted.newDate;
                          return date.set({ hour, minute });
                      }
                  })();

        dispatch("defer", { task, time });
    };
</script>

<div class="modal-box flex min-h-[65%] w-fit flex-col justify-center">
    {#key task}
        <div class="flex justify-center">
            <div role="tablist" class="tabs-boxed tabs w-2/3 bg-neutral">
                {#each ["time", "calendar"] as tab (tab)}
                    <button
                        role="tab"
                        tabindex="0"
                        class={tab === ($isTimeTabActive ? "time" : "calendar")
                            ? "tab tab-active"
                            : "tab bg-neutral"}
                        on:click={() => selectTab(tab)}
                    >
                        <svelte:component
                            this={tab === "time" ? ClockIcon : CalendarIcon}
                            class="h-5 w-5 [&>path]:stroke-[3]"
                        />
                    </button>
                {/each}
            </div>
        </div>

        {#key $tasks}
            {#if $isTimeTabActive}
                <TimePicker {task} tasks={$tasks} on:defer={handleDefer} />
            {:else}
                <DatePicker taskToDefer={task} {tz} tasks={$tasks} on:defer={handleDefer} />
            {/if}
        {/key}
    {/key}
</div>

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
