<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { writable, derived } from "svelte/store";
    import { Icon, Calendar, Clock } from "svelte-hero-icons";
    import { DateTime } from "luxon";
    import { todoistData } from "../../js/stores";
    import { createDateWithTime } from "../../js/time";
    import DatePicker from "./DatePicker.svelte";
    import TimePicker from "./TimePicker.svelte";
    import type { Writable, Readable } from "svelte/store";
    import type { Task } from "../../../types/todoist";

    export let task: Task;

    const isTimeTabActive: Writable<boolean> = writable(false);
    $: isTimeTabActive.set(Boolean(task.due && task.due.allDay !== 1));

    /**
     * Selects the active tab ("time" or "calendar").
     * @param tab - The tab to activate.
     */
    function selectTab(tab: "time" | "calendar"): void {
        isTimeTabActive.set(tab === "time");
    }
    /**
     * Helper to safely select tab from string (for template use).
     * @param tab - Defer modal tab to be selected.
     */
    function selectTabSafe(tab: string): void {
        selectTab(tab as "time" | "calendar");
    }

    const tz: string = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

    const tasks: Readable<Task[]> = derived(todoistData, ($todoistData) => $todoistData.tasks);

    interface DeferEventDetail {
        rawTime: string | number;
    }

    interface DeferEvent {
        detail: DeferEventDetail;
    }

    const dispatch = createEventDispatcher<{
        defer: { task: Task; time: DateTime };
    }>();

    /**
     * Handles the defer event from the child component.
     * Calculates the new time and dispatches the "defer" event.
     * @param event - The event containing the raw time to defer to.
     */
    function handleDefer(event: DeferEvent): void {
        const { rawTime } = event.detail;
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

        dispatch("defer", { task, time });
    }
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
                        on:click={() => selectTabSafe(tab)}
                    >
                        <Icon
                            src={tab === "time" ? Clock : Calendar}
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
