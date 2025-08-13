import type { Writable } from "svelte/store";
import type { DateTime } from "luxon";
import type { ListBullet } from "svelte-hero-icons";
import type { Task } from "./todoist";
import type { DynalistTaskType } from "./dynalist";

export type ResettableStore<T> = Writable<T> & {
    reset: () => void;
};

export interface PromiseProp {
    dataPromise: Promise<void>;
    updateDisplayedTask: () => Promise<void>;
    handleRefresh: () => Promise<void>;
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
    dateInfo?: Record<string, { dots: { color: string }[]; tasks: Task[] }>;
    onDayClick?: ((day: DateTime) => void) | undefined;
    disable?: "past" | "future" | null;
}
export interface CalendarHeaderProps {
    disable?: "past" | "future" | null;
    displayDate: DateTime;
    onchangeMonth: (date: DateTime) => void;
}

export type DynamicModalProps = {
    onDeferFinal?: (detail: { task: Task; time: DateTime }) => void;
    title?: string;
};

export interface TaskDisplayProps {
    task: Task;
    updateDisplayedTask: () => Promise<void>;
    handleRefresh: () => Promise<void>;
}
