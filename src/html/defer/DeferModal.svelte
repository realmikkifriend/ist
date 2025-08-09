<script lang="ts">
    import { Icon, Calendar, Clock } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import { createDateWithTime } from "../../utils/timeUtils";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import type { Task } from "../../types/todoist";
    import type { DeferEventDetail, DeferModalProps } from "../../types/defer";

    let { task, onDeferFinal }: DeferModalProps = $props();

    let isTimeTabActive: boolean = $derived(Boolean(task.due && task.due.allDay !== 1));

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
                ? DateTime.now().setZone(tz).plus({ milliseconds: rawTime })
                : (() => {
                      const date = DateTime.fromISO(rawTime);
                      const tomorrow = DateTime.now().plus({ days: 1 }).setZone(tz);

                      const extracted = task.due
                          ? createDateWithTime(task.due.string, tomorrow)
                          : { newDate: null };
                      if (extracted.newDate === null) {
                          return date;
                      } else {
                          const { hour, minute } = extracted.newDate;
                          return date.set({ hour, minute });
                      }
                  })();

        onDeferFinal({ task, time });
    }
</script>

<div class="modal-box flex min-h-[64%] w-84 flex-col justify-start overflow-hidden">
    {#key task}
        <div class="flex justify-center">
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
                    </button>
                {/each}
            </div>
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
