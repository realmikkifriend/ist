import type { SvelteComponent } from "svelte";

export type ToastConfig = {
    intro?: { x: number };
    theme?: Record<string, string | number>;
    duration?: number;
    dismissable?: boolean;
    target?: string;
    initial?: number;
    component?: {
        src: typeof SvelteComponent;
        props: {
            onClick: () => void;
        };
    };
};
