import { toast } from "@zerodevx/svelte-toast";

export const success = (m) =>
    toast.push(m, {
        theme: {
            "--toastBarHeight": 0,
            "--toastColor": "mintcream",
            "--toastBackground": "rgba(72,187,120,0.9)",
        },
        duration: 1000,
        dismissable: false,
        intro: { y: 16000 },
    });

export const newFirstTask = (component, onClickHandler) => {
    const toastInstance = toast.push({
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
    });
};

export const error = (m) =>
    toast.push(m, {
        theme: {
            "--toastBarHeight": 0,
            "--toastColor": "white",
            "--toastBackground": "rgba(255, 0, 0, 0.8)",
        },
        initial: 0,
        dismissable: true,
        intro: { y: 16000 },
    });
