import { persisted } from "svelte-persisted-store";

/**
 * Stores the Todoist access token.
 */
export const todoistAccessToken = persisted<string>("todoist_access_token", "");

/**
 * Stores the Dynalist access token.
 */
export const dynalistAccessToken = persisted<string>("dynalist_access_token", "");
