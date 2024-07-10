<script>
    import { success } from "../../../js/toasts";
    import { updateDynalist } from "./dynalist";
    export let content;

    let [_, total, current, date] =
        content.note
            .match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/)
            ?.map((val) => (val && !isNaN(val) ? parseInt(val) : val)) || [];

    const todayFormatted = new Date().toLocaleDateString("en-CA"),
        options = ["+1", "+5", "+10"];

    if (date !== todayFormatted) {
        date = todayFormatted;
        current = 0;
    }

    async function handleCount(option, event) {
        current = (+current || 0) + +option.slice(1);
        const newNote = `count ${total}/${current} ${todayFormatted}`;

        const changes = [
            {
                action: "edit",
                node_id: content.id,
                note: newNote,
            },
        ];

        await updateDynalist(content.file_id, changes);
        success("Updated count!");
    }

    function calculateLabel(current) {
        const now = new Date();
        const startHour = 8;
        const endHour = 22;
        const totalHours = endHour - startHour;
        const currentHour = now.getHours();
        let goalCount;

        if (currentHour < startHour) {
            goalCount = 0;
        } else if (currentHour > endHour) {
            goalCount = total;
        } else {
            let hoursPassed = currentHour - startHour;
            goalCount = (hoursPassed / totalHours) * total;
        }

        const percentageComplete = (current / total) * 100;
        let label, classes;

        if (percentageComplete >= 100) {
            label = "complete";
            classes = "bg-blue-500 text-blue-100";
        } else if (currentHour > endHour && percentageComplete < 100) {
            label = "incomplete";
            classes = "";
        } else if (percentageComplete === 0) {
            label = "not started";
            classes = "bg-red-500 text-red-100";
        } else if (current >= goalCount * 1.2) {
            label = "ahead";
            classes = "bg-purple-500 text-purple-100";
        } else if (current <= goalCount * 0.5) {
            label = "way behind";
            classes = "bg-orange-500 text-orange-100";
        } else if (current <= goalCount * 0.8) {
            label = "behind";
            classes = "bg-yellow-600 text-yellow-100";
        } else {
            label = "on track";
            classes = "bg-green-700 text-green-100";
        }

        return { label, classes };
    }

    $: labelInfo = calculateLabel(current);
</script>

<span class="flex w-full flex-col justify-between">
    <span class="flex w-full items-center text-xl">
        {content.content}
        <span
            class="badge badge-xs w-fit overflow-hidden p-2 text-[0.6rem] font-bold uppercase {labelInfo.classes} ml-1"
        >
            {labelInfo.label}
        </span>
    </span>

    <span class="flex w-full items-end justify-between">
        <span class="flex flex-nowrap items-baseline">
            <span class="text-2xl {current >= total ? 'text-blue-500' : ''}">{current}</span>
            <span class="ml-2 mr-3 text-base text-secondary">
                <span class="text-lg">&#8725;</span>{total}
            </span>
            <small class={current >= total ? "text-blue-500" : ""}>
                {`${Math.round((current / total) * 100)}%`}
            </small>
        </span>
        <span class="flex flex-nowrap items-end">
            {#each options as option}
                <button
                    class="btn ml-1 h-8 min-h-8 px-1 pb-1 pt-0 text-primary-content hover:bg-base-100 active:bg-primary {current >=
                    total
                        ? 'bg-neutral'
                        : 'bg-primary'}"
                    on:click={(event) => handleCount(option, event)}
                >
                    {option}
                </button>
            {/each}
        </span>
    </span>
</span>
