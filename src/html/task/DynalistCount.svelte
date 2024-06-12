<script>
    export let content;

    let [_, total, current, date] =
        content.note.match(/count (\d+)(?:\/(\d+))?\s*(\d{4}-\d{1,2}-\d{1,2})?/) || [];

    let todayFormatted = new Date().toLocaleDateString("en-CA");

    if (date !== todayFormatted) {
        date = todayFormatted;
        current = 0;
    }
</script>

<span class="flex w-full justify-between">
    <span>
        <span class="text-xl">{content.content}</span>
        <br />
        <span class="text-2xl">{current}</span>
        <span class="mx-2 text-lg">/{total}</span>
        <small>{`${Math.round((current / total) * 100)}%`}</small>
    </span>

    <span class="content-end">+1 +5 +10</span>
</span>
