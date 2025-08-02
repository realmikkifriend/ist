import type { SvelteComponent } from "svelte";
import type { DateTime } from "luxon";

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

export interface UserSettings {
    selectedContext: { id: string; name: string } | null;
}

export interface ToastMessage {
    id: string;
    type: "success" | "error" | "info";
    message: string;
    expirationTime: DateTime;
    action?: () => void;
}
