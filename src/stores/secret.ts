import { resettablePersisted, registerStore } from "./reset";

/**
 * Stores the Todoist access token.
 */
export const todoistAccessToken = resettablePersisted<string>("todoist_access_token", "");
registerStore(todoistAccessToken);

/**
 * Stores the Dynalist access token.
 */
export const dynalistAccessToken = resettablePersisted<string>("dynalist_access_token", "");
registerStore(dynalistAccessToken);
