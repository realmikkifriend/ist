import { DateTime } from "luxon";
import { toastMessages } from "../stores/interface";
import type { ToastMessage } from "../types/interface";
import type { Task } from "../types/todoist";

/**
 * Adds a toast message to the store.
 * @param {"success" | "error" | "info"} type - The type of toast message.
 * @param {string} message - The message to display.
 * @param {number} duration - The duration in milliseconds to display the message.
 * @param {Function} action - An optional function to execute on click.
 */
export function addToast(
    type: "success" | "error" | "info",
    message: string,
    duration: number,
    action?: () => void,
): void {
    const id = Math.random().toString(36).substring(2, 9);
    const expirationTime = DateTime.now().plus({ milliseconds: duration });

    const toast: ToastMessage = {
        id,
        type,
        message,
        expirationTime,
        action,
    };

    toastMessages.update((toasts) => {
        const otherToasts = toasts.filter((t) => t.message !== message || t.type !== type);
        return [...otherToasts, toast];
    });

    setTimeout(() => {
        removeToast(id);
    }, duration);
}

/**
 * Removes a toast message from the store.
 * @param {string} id - The ID of the toast message to remove.
 */
export function removeToast(id: string): void {
    toastMessages.update((toasts) => toasts.filter((toast) => toast.id !== id));
}

/**
 * Shows a success toast with a custom message.
 * @param {string} message - The message to display in the toast.
 */
export function success(message: string): void {
    addToast("success", message, 1000);
}

/**
 * Shows an error toast with a custom message.
 * @param {string} message - The error message to display in the toast.
 */
export function error(message: string): void {
    addToast("error", message, 5000);
}

/**
 * Shows a custom toast with a Svelte component and a click handler.
 * @param {() => void} onClickHandler - Function to call when the component is clicked.
 * @param {Task} task - The task to be summoned on toast click.
 */
export function newFirstTask(onClickHandler: (task: Task) => void, task: Task): void {
    addToast("info", "First due task has changed! Click here to update...", 10000, () =>
        onClickHandler(task),
    );
}
