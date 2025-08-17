<script lang="ts">
    import { Icon, Calendar, Clock } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import { shortcut } from "@svelte-put/shortcut";
    import { todoistData } from "../../stores/stores";
    import { createDateWithTime } from "../../utils/timeUtils";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import type { Task } from "../../types/todoist";
    import type { DeferEventDetail } from "../../types/defer";

    let {
        task,
        onDeferFinal,
    }: { task: Task; onDeferFinal?: (detail: { task: Task; time: DateTime }) => void } = $props();

    let isTimeTabActive: boolean = $state(Boolean(task.due && task.due.allDay !== 1));

    /**
     * Selects the active tab ("time" or "calendar").
     * @param tab - The tab to activate.
     */
    function selectTab(tab: "time" | "calendar"): void {
        isTimeTabActive = tab === "time";
    }

    const tz: string = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

    const tasks: Task[] = $derived($todoistData.tasks);

    /**
     * Handles the defer event from the child component.
     * Calculates the new time and dispatches the "defer" event.
     * @param detail - The detail containing the raw time to defer to.
     */
    function handleDefer(detail: DeferEventDetail): void {
        const { rawTime } = detail;
        isTimeTabActive = true;

        const time: DateTime =
            typeof rawTime === "number"
                ? DateTime.local({ zone: tz }).plus({ milliseconds: rawTime })
                : (() => {
                      const date = DateTime.fromISO(rawTime);
                      const tomorrow = DateTime.local({ zone: tz }).plus({ days: 1 });

                      const extracted = task.due
                          ? createDateWithTime(task.due.string, tomorrow)
                          : { newDate: null };
                      if (extracted.newDate === null) {
                          return date;
                      } else {
                          const { hour, minute } = extracted.newDate;
                          return DateTime.fromObject(
                              {
                                  year: date.year,
                                  month: date.month,
                                  day: date.day,
                                  hour: hour,
                                  minute: minute,
                              },
                              { zone: date.zoneName ?? tz },
                          );
                      }
                  })();

        if (onDeferFinal) {
            onDeferFinal({ task, time });
        }
    }
</script>

<div class="modal-box flex min-h-[64%] w-84 flex-col justify-start overflow-hidden">
    {#key task}
        <div class="relative flex justify-center">
            <div class="tabs-box tabs bg-neutral h-10 w-2/3 justify-center" role="tablist">
                {#each ["time", "calendar"] as tab (tab)}
                    <button
                        class={`tab h-8 w-1/2 ${
                            tab === (isTimeTabActive ? "time" : "calendar")
                                ? "tab-active"
                                : "bg-neutral"
                        }`}
                        onclick={() => selectTab(tab as "time" | "calendar")}
                        role="tab"
                        tabindex="0"
                        type="button"
                    >
                        <Icon
                            class="h-5 w-5 [&>path]:stroke-3"
                            src={tab === "time" ? Clock : Calendar}
                        />
                        <kbd>{tab === "time" ? "←" : "→"}</kbd>
                    </button>
                {/each}
            </div>
            <kbd>Esc</kbd>
        </div>

        {#key tasks}
            {#if isTimeTabActive}
                <TimePicker onDefer={handleDefer} {task} {tasks} />
            {:else}
                <DatePicker onDefer={handleDefer} taskToDefer={task} {tasks} {tz} />
            {/if}
        {/key}
    {/key}
</div>

<form class="modal-backdrop" method="dialog">
    <button type="submit">close</button>
</form>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "ArrowRight",
                callback: () => selectTab("calendar"),
                modifier: false,
            },
            {
                key: "ArrowLeft",
                callback: () => selectTab("time"),
                modifier: false,
            },
        ],
    }}
/>
