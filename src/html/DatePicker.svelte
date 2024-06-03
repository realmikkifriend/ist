<script>
    import { createEventDispatcher } from "svelte";
    import SveltyPicker from "svelty-picker";
    export let task;

    let valueDefault;

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let tomorrowStr = tomorrow.toISOString().split("T")[0];

    const dispatch = createEventDispatcher();

    const handleDefer = (event) => {
        const ms = event.detail;
        dispatch("defer", { task, ms });
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
