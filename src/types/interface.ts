import type { DateTime } from "luxon";
import type { ListBullet } from "svelte-hero-icons";
import type { Task } from "./todoist";
import type { DynalistTaskType } from "./dynalist";

export interface PromiseProp {
    dataPromise: Promise<void>;
}

export interface UserSettings {
    selectedContext: { id: string; name: string } | null;
}

export interface HashProp {
    hash: string;
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

export interface LogoProps {
    type: "todoist" | "dynalist";
    size?: number;
    style?: string;
}

export interface CalendarProps {
    dateInfo?: Record<string, { dots: { color: string }[]; tasks: Task[] }>;
    onDayClick?: ((day: DateTime) => void) | undefined;
    disable?: "past" | "future" | null;
}
