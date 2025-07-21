<script>
    import { writable } from "svelte/store";
    import { success } from "../../../js/toasts";
    import { updateDynalist } from "./dynalistApi";

    export let content;

    const parseCountData = (note) => {
        const match = note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/);
        const [_, total, current, date] =
            match?.map((val) => (val && !isNaN(val) ? parseInt(val) : val)) || [];
        return { total, current, date };
    };

    const todayFormatted = new Date().toLocaleDateString("en-CA");
    const options = ["+1", "+5", "+10"];

    const initialData = parseCountData(content.note);

    const getAdjustedData = (data, today) => {
        if (data.date !== today) {
            return { ...data, date: today, current: 0 };
        }
        return data;
    };

    const countData = writable(getAdjustedData(initialData, todayFormatted));

    const createUpdatedCountData = (currentData, increment) => ({
        ...currentData,
        current: (+currentData.current || 0) + increment,
    });

    const createNoteString = (total, current, date) => `count ${total}/${current} ${date}`;

    const createApiChanges = (nodeId, noteString) => [
        {
            action: "edit",
            node_id: nodeId,
            note: noteString,
        },
    ];

    async function handleCount(option) {
        const increment = +option.slice(1);
        const updatedData = createUpdatedCountData($countData, increment);
        const newNote = createNoteString(updatedData.total, updatedData.current, todayFormatted);
        const changes = createApiChanges(content.id, newNote);

        await updateDynalist(content.file_id, changes);

        countData.set(updatedData);

        success("Updated count!");
    }

    function calculateLabel(countData) {
        const { current, total } = countData;
        const now = new Date();
        const startHour = 8;
        const endHour = 22;
        const totalHours = endHour - startHour;
        const currentHour = now.getHours();

        const calculateGoalCount = (currentHour, startHour, endHour, totalHours, total) => {
            if (currentHour < startHour) return 0;
            if (currentHour > endHour) return total;
            const hoursPassed = currentHour - startHour;
            return (hoursPassed / totalHours) * total;
        };

        const goalCount = calculateGoalCount(currentHour, startHour, endHour, totalHours, total);
        const percentageComplete = (current / total) * 100;

        const determineLabelAndClasses = (
            percentageComplete,
            currentHour,
            endHour,
            current,
            goalCount,
        ) => {
            if (percentageComplete >= 100) {
                return { label: "complete", classes: "bg-blue-500 text-blue-100" };
            } else if (currentHour > endHour && percentageComplete < 100) {
                return { label: "incomplete", classes: "" };
            } else if (percentageComplete === 0) {
                return { label: "ready", classes: "bg-neutral text-secondary" };
            } else if (current >= goalCount * 1.2) {
                return { label: "ahead", classes: "bg-purple-500 text-purple-100" };
            } else if (current <= goalCount * 0.5) {
                return { label: "way behind", classes: "bg-orange-500 text-orange-100" };
            } else if (current <= goalCount * 0.8) {
                return { label: "behind", classes: "bg-yellow-600 text-yellow-100" };
            } else {
                return { label: "on track", classes: "bg-green-700 text-green-100" };
            }
        };

        return determineLabelAndClasses(
            percentageComplete,
            currentHour,
            endHour,
            current,
            goalCount,
        );
    }

    $: labelInfo = calculateLabel($countData);
</script>

<span class="flex w-full flex-col justify-between">
    <span class="flex w-full items-center text-xl">
        {content.content}
        <span
            class="badge badge-xs ml-1 w-fit overflow-hidden whitespace-nowrap p-2 px-3 pt-[0.45rem] text-[0.6rem] font-bold uppercase {labelInfo.classes}"
        >
            {labelInfo.label}
        </span>
    </span>

    <span class="flex w-full items-end justify-between">
        <span class="flex flex-nowrap items-baseline">
            <span class="text-2xl {$countData.current >= $countData.total ? 'text-blue-500' : ''}"
                >{$countData.current}</span
            >
            <span class="ml-2 mr-3 text-base text-secondary">
                <span class="text-lg">&#8725;</span>{$countData.total}
            </span>
            <small class={$countData.current >= $countData.total ? "text-blue-500" : ""}>
                {`${Math.round(($countData.current / $countData.total) * 100)}%`}
            </small>
        </span>
        <span class="flex flex-nowrap items-end">
            {#each options as option, index (index)}
                <button
                    class="btn ml-1 h-8 min-h-8 px-1 pb-1 pt-0 text-primary-content hover:bg-base-100 active:bg-primary {$countData.current >=
                    $countData.total
                        ? 'bg-neutral'
                        : 'bg-primary'}"
                    on:click={(event) => handleCount(option)}
                >
                    {option}
                </button>
            {/each}
        </span>
    </span>
</span>
