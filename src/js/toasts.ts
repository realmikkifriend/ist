import { toast } from "@zerodevx/svelte-toast";
import type { SvelteComponent } from "svelte";
import type { ToastConfig } from "../../types/interface";

/**
 * Base configuration for all toasts.
 */
const baseConfig: ToastConfig = {
    intro: { x: 16000 },
};

/**
 * Creates a toast configuration object by merging the base config with overrides.
 * @param {Partial<ToastConfig>} overrides - Partial configuration to override base settings.
 * @returns {ToastConfig} The merged toast configuration.
 */
const createToastConfig = (overrides: Partial<ToastConfig>): ToastConfig => ({
    ...baseConfig,
    ...overrides,
});

/**
 * Shows a success toast with a custom message.
 * @param {string} m - The message to display in the toast.
 * @returns {number} The toast ID.
 */
export const success = (m: string): number => {
    toast.pop({ target: "success" });
    return toast.push(
        m,
        createToastConfig({
            theme: {
                "--toastBarHeight": 0,
                "--toastColor": "mintcream",
                "--toastBackground": "rgba(72,187,120,0.9)",
            },
            duration: 1000,
            dismissable: false,
            target: "success",
        }),
    );
};

/**
 * Shows a custom toast with a Svelte component and a click handler.
 * @param {typeof SvelteComponent} component - The Svelte component to render in the toast.
 * @param {() => void} onClickHandler - Function to call when the component is clicked.
 * @returns {number} The toast ID.
 */
export const newFirstTask = (
    component: typeof SvelteComponent,
    onClickHandler: () => void,
): number => {
    toast.pop({ target: "wait" });
    const toastInstance = toast.push(
        createToastConfig({
            component: {
                src: component,
                props: {
                    onClick: () => {
                        onClickHandler();
                        toast.pop(toastInstance);
                    },
                },
            },
            theme: {
                "--toastColor": "white",
                "--toastBackground": "orange",
            },
            initial: 0,
            target: "wait",
        }),
    );
    return toastInstance;
};

/**
 * Shows an error toast with a custom message.
 * @param {string} m - The error message to display in the toast.
 * @returns {number} The toast ID.
 */
export const error = (m: string): number =>
    toast.push(
        m,
        createToastConfig({
            theme: {
                "--toastBarHeight": 0,
                "--toastColor": "white",
                "--toastBackground": "rgba(255, 0, 0, 0.8)",
            },
            initial: 0,
            dismissable: true,
            target: "error",
        }),
    );
