<script>
    export let content;

    let [_, total, current, date] =
        content.note.match(/count (\d+)\/(\d+) (\d{1,2}-\d{1,2}-\d{4})/) || [];

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
        <span class="text-2xl">{current} / {total}</span>
        <small>{`${Math.round((current / total) * 100)}%`}</small>
    </span>

    <span class="content-end">+1 +5 +10</span>
</span>
