import type { Writable } from "svelte/store";
import type { DateTime } from "luxon";
import type { ListBullet } from "svelte-hero-icons";
import type { Task } from "./todoist";
import type { DynalistTaskType } from "./dynalist";
import type { DateInfo } from "./calendar";

export type ResettableStore<T> = Writable<T> & {
    reset: () => void;
};

export interface PromiseProp {
    dataPromise: Promise<void>;
}

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

export interface LogoProps {
    type: "todoist" | "dynalist";
    size?: number;
    style?: string;
}

export interface CalendarProps {
    dateInfo?: DateInfo;
    onDayClick?: ((day: DateTime) => void) | undefined;
    disable?: "past" | "future" | null;
}

export type DynamicModalProps = {
    onDeferFinal?: (detail: { task: Task; time: DateTime }) => void;
    title?: string;
};
