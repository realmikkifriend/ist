<script lang="ts">
    import { writable, derived } from "svelte/store";
    import { Icon, Calendar, Clock } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import { todoistData } from "../../stores/stores";
    import { createDateWithTime } from "../../utils/timeUtils";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import type { Writable, Readable } from "svelte/store";
    import type { Task } from "../../types/todoist";
    import type { DeferEventDetail, DeferModalProps } from "../../types/defer";

    let { task, onDeferFinal }: DeferModalProps = $props();

    const isTimeTabActive: Writable<boolean> = writable(false);

    $effect(() => {
        isTimeTabActive.set(Boolean(task.due && task.due.allDay !== 1));
    });

    /**
     * Selects the active tab ("time" or "calendar").
     * @param tab - The tab to activate.
     */
    function selectTab(tab: "time" | "calendar"): void {
        isTimeTabActive.set(tab === "time");
    }

    const tz: string = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

    const tasks: Readable<Task[]> = derived(todoistData, ($todoistData) => $todoistData.tasks);

    /**
     * Handles the defer event from the child component.
     * Calculates the new time and dispatches the "defer" event.
     * @param detail - The detail containing the raw time to defer to.
     */
    function handleDefer(detail: DeferEventDetail): void {
        const { rawTime } = detail;
        isTimeTabActive.set(true);

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
            <div role="tablist" class="tabs-box tabs bg-neutral h-10 w-2/3 justify-center">
                {#each ["time", "calendar"] as tab (tab)}
                    <button
                        role="tab"
                        tabindex="0"
                        class={`tab h-8 w-1/2 ${
                            tab === ($isTimeTabActive ? "time" : "calendar")
                                ? "tab-active"
                                : "bg-neutral"
                        }`}
                        onclick={() => selectTab(tab as "time" | "calendar")}
                    >
                        <Icon
                            src={tab === "time" ? Clock : Calendar}
                            class="h-5 w-5 [&>path]:stroke-3"
                        />
                    </button>
                {/each}
            </div>
        </div>

        {#key $tasks}
            {#if $isTimeTabActive}
                <TimePicker {task} tasks={$tasks} onDefer={handleDefer} />
            {:else}
                <DatePicker taskToDefer={task} {tz} tasks={$tasks} onDefer={handleDefer} />
            {/if}
        {/key}
    {/key}
</div>

<form method="dialog" class="modal-backdrop">
    <button>close</button>
</form>
