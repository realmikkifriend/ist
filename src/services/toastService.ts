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
    const startTime = DateTime.now();

    const toast: ToastMessage = {
        id,
        type,
        message,
        expirationTime,
        progress: 0,
        action,
    };

    toastMessages.update((toasts) => {
        const otherToasts = toasts.filter((t) => t.message !== message || t.type !== type);
        return [...otherToasts, toast];
    });

    const intervalTime = 50;

    const progressInterval = setInterval(() => {
        const now = DateTime.now();
        toastMessages.update((toasts) =>
            toasts.map((t) => {
                if (t.id === id) {
                    const elapsedTime = now.diff(startTime, "milliseconds").milliseconds;
                    const calculatedProgress = Math.min((elapsedTime / duration) * 100, 100);
                    return { ...t, progress: calculatedProgress };
                }
                return t;
            }),
        );

        if (now >= expirationTime) {
            clearInterval(progressInterval);
        }
    }, intervalTime);

    setTimeout(() => {
        clearInterval(progressInterval);
        clearToasts(id);
    }, duration);
}

/**
 * Clears toast messages from the store based on ID or type.
 * If no arguments are provided, all toasts are cleared.
 * @param {string} id - The ID of the toast message to remove.
 * @param {"success" | "error" | "info"} type - The type of toast messages to remove.
 */
export function clearToasts(id?: string, type?: "success" | "error" | "info"): void {
    toastMessages.update((toasts) => {
        if (id) {
            return toasts.filter((toast) => toast.id !== id);
        }
        if (type) {
            return toasts.filter((toast) => toast.type !== type);
        }
        return [];
    });
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
    addToast("info", "New first-due task! Click to update...", 10000, () => onClickHandler(task));
}
