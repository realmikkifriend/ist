import type { UserSettings, ToastMessage } from "../types/interface";
import { resettablePersisted, resettableWritable, registerStore } from "./reset";

/**
 * Stores user settings.
 */
export const userSettings = resettablePersisted<UserSettings>("user_settings", {
    selectedContext: null,
});
registerStore(userSettings);

/**
 * Stores toast messages.
 */
export const toastMessages = resettableWritable<ToastMessage[]>([]);
registerStore(toastMessages);
