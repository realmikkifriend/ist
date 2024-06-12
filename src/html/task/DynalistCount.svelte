<script>
    import { success } from "../../js/toasts";
    import { updateDynalist } from "../../js/dynalist";
    export let content;

    let [_, total, current, date] =
        content.note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/) || [];

    let todayFormatted = new Date().toLocaleDateString("en-CA");

    if (date !== todayFormatted) {
        date = todayFormatted;
        current = 0;
    }

    const options = ["+1", "+5", "+10"];

    async function handleCount(option) {
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

<span class="flex w-full justify-between">
    <span>
        <span class="text-xl">{content.content}</span>
        <br />
        <span class="text-2xl">{current}</span>
        <span class="mx-2 text-lg">&#8725;{total}</span>
        <small>{`${Math.round((current / total) * 100)}%`}</small>
    </span>

    <span class="content-end">
        {#each options as option}
            <button
                class="btn ml-1 h-8 min-h-8 bg-primary px-2 pb-1 pt-0 text-white hover:bg-base-100"
                on:click={() => handleCount(option)}>{option}</button
            >
        {/each}
    </span>
</span>
