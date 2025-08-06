import type { DateTime } from "luxon";
import type { ListBullet } from "svelte-hero-icons";
import type { DynalistTaskType } from "./dynalist";

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

export interface IconPair {
    icon: typeof ListBullet;
    label: string;
    type: DynalistTaskType;
}
