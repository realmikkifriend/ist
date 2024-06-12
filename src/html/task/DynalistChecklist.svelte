<script>
    import Markdown from "svelte-exmarkdown";
    export let content;

    function parseContent(content) {
        const lines = content.split("\n");
        const result = [];

        for (let line of lines) {
            if (line.startsWith("  - ")) {
                if (result.length > 0) {
                    result[result.length - 1] += "\n" + line;
                }
            } else {
                result.push(line.substring(2).trim());
            }
        }

        return result;
    }

    const checklistItems = parseContent(content);
    let currentIndex = 0;

    let buttonElement;

    function showNextItem() {
        buttonElement.classList.add("bg-secondary");

        setTimeout(() => {
            if (currentIndex < checklistItems.length - 1) {
                currentIndex++;
                buttonElement.classList.remove("bg-secondary");
            }
        }, 200);
    }
</script>

<div>
    <button
        bind:this={buttonElement}
        class="float-left mr-2 mt-1 inline-block h-5 w-5 cursor-pointer border-2 border-secondary transition-colors"
        on:click={showNextItem}
    />
    <Markdown md={checklistItems[currentIndex]} />
</div>
