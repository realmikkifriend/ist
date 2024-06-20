<script>
    import { success } from "../../../js/toasts";
    import { updateDynalist } from "./dynalist";
    export let content;

    let [_, total, current, date] =
        content.note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/) || [];

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
</script>

<span class="flex w-full flex-col justify-between">
    <span class="w-full text-xl">{content.content}</span>
    <span class="flex w-full items-end justify-between">
        <span class="flex flex-nowrap items-baseline">
            <span class="text-2xl">{current}</span>
            <span class="mx-1 text-lg">&#8725;{total}</span>
            <small>{`${Math.round((current / total) * 100)}%`}</small>
        </span>
        <span class="flex flex-nowrap items-end">
            {#each options as option}
                <button
                    class="btn ml-1 h-8 min-h-8 bg-primary px-1 pb-1 pt-0 text-white hover:bg-base-100 active:bg-primary"
                    on:click={(event) => handleCount(option, event)}
                    >{option}
                </button>
            {/each}
        </span>
    </span>
</span>
