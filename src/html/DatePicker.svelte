<script>
    import { createEventDispatcher } from "svelte";
    import { DateTime } from "luxon";
    import SveltyPicker from "svelty-picker";
    export let tz;

    let valueDefault;

    let tomorrow = DateTime.now().setZone(tz).plus({ days: 1 });
    let tomorrowStr = tomorrow.toISODate();

    const dispatch = createEventDispatcher();

    const handleDefer = ({ detail: rawTime }) => {
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
