import { persisted } from "svelte-persisted-store";

export const todoistAccessToken = persisted("todoist_access_token", "");
