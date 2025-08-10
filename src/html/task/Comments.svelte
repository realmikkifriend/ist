<script lang="ts">
    import { Icon, ArrowPath } from "svelte-hero-icons";
    import { shortcut } from "@svelte-put/shortcut";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import DynalistComment from "./dynalist/DynalistComment.svelte";
    import DynalistAuthRequest from "./dynalist/DynalistAuthRequest.svelte";
    import { dynalistAccessToken } from "../../stores/secret";
    import type { Comment, CommentsProps } from "../../types/todoist";

    let { commentsPromise }: CommentsProps = $props();

    /**
     * Checks provided comments for Dynalist URL.
     * @param comments - Comments to check for URL.
     * @returns Whether any comments contain the URL.
     */
    function hasDynalistUrl(comments: Comment[]): boolean {
        return comments.some((comment) => comment.content.startsWith("https://dynalist.io/d/"));
    }

    /**
     * Cycles focus through comment elements.
     */
    function focusComment() {
        const commentItems = Array.from(document.querySelectorAll<HTMLElement>(".comment-item"));
        if (commentItems.length === 0) return;

        const focusableCommentElements: HTMLElement[] = commentItems.reduce(
            (acc: HTMLElement[], item) => {
                const focusChildren = Array.from(
                    item.querySelectorAll<HTMLElement>(".comment-focus"),
                );
                if (focusChildren.length > 0) {
                    acc.push(...focusChildren);
                } else {
                    acc.push(item);
                }
                return acc;
            },
            [],
        );

        const activeElement = document.activeElement;
        const activeElementIndex = focusableCommentElements.findIndex((el) => el === activeElement);

        const nextElementToFocus: HTMLElement =
            activeElementIndex === -1 || activeElementIndex === focusableCommentElements.length - 1
                ? focusableCommentElements[0]
                : focusableCommentElements[activeElementIndex + 1];

        if (nextElementToFocus) {
            // Reset tabIndex for all focusable comment elements
            focusableCommentElements.forEach((el) => {
                el.tabIndex = -1;
            });

            nextElementToFocus.tabIndex = 0; // Make the target element tabbable
            nextElementToFocus.focus();
        }
    }
</script>

<div>
    {#await commentsPromise}
        <div
            class="prose bg-accent text-primary-content mx-auto flex w-11/12 flex-row items-center rounded-b-xl p-4 opacity-25"
        >
            <Icon class="mr-2 h-4 w-4 animate-spin" src={ArrowPath} />
            <p>Loading comments...</p>
        </div>
    {:then comments}
        {#if comments && comments.length > 0}
            <div
                class="prose bg-accent text-primary-content divide-neutral mx-auto flex w-11/12 flex-col gap-y-2 divide-y-3 divide-solid rounded-b-xl p-4"
            >
                {#if hasDynalistUrl(comments) && !$dynalistAccessToken}
                    <DynalistAuthRequest />
                {/if}

                {#each comments as comment, index (index)}
                    <div class="comment-item" tabindex="-1">
                        {#if comment.content.startsWith("https://dynalist.io/d/")}
                            {#if $dynalistAccessToken}
                                <DynalistComment url={comment.content} />
                            {:else}
                                Dynalist URL detected but no access code stored.
                            {/if}
                        {:else}
                            <SvelteMarkdown source={comment.content} />
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {:catch error}
        <div class="prose bg-accent text-primary-content mx-auto w-11/12 rounded-b-xl p-4">
            <p>Error loading comments: {error.message}</p>
        </div>
    {/await}
</div>

<svelte:window
    use:shortcut={{
        trigger: [
            {
                key: "z",
                callback: focusComment,
                modifier: false,
            },
        ],
    }}
/>
