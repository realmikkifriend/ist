import type { DateTime } from "luxon";

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
