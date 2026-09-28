import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ActivityEvent } from "@doist/todoist-sdk";
import type { Comment, Context, Task, User } from "../../src/types/todoist";

/**
 * Directory holding the e2e fixtures (produced by `download-fixtures.mjs`, never committed).
 */
const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

/**
 * Reads a fixture file and returns its parsed JSON in the raw wire format (snake_case).
 * Pass the result directly to Playwright route fulfillers to mock `api.todoist.com`.
 * @param {"tasks" | "projects" | "user" | "comments" | "activity"} name - The fixture to load.
 * @returns {unknown} The parsed fixture contents.
 */
export function rawFixture(name: "tasks" | "projects" | "user" | "comments" | "activity"): unknown {
    const file = path.join(FIXTURE_DIR, `${name}.json`);
    if (!existsSync(file)) {
        throw new Error(
            `Missing e2e fixture "${file}". Run "node tests/e2e/download-fixtures.mjs" first ` +
                "(requires TODOIST_ACCESS_TOKEN in .env or the environment).",
        );
    }
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

/**
 * Converts a single snake_case key to camelCase.
 * @param {string} key - The key to convert.
 * @returns {string} The camelCase key.
 */
const toCamelKey = (key: string): string =>
    key.replace(/_([a-z0-9])/g, (_m, letter: string): string => letter.toUpperCase());

/**
 * Recursively converts a raw wire-format (snake_case) payload to the SDK's camelCase shape.
 * @param {unknown} value - The payload to convert.
 * @returns {unknown} The converted payload.
 */
const toCamel = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(toCamel);
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, val]) => [
                toCamelKey(key),
                toCamel(val),
            ]),
        );
    }
    return value;
};

/**
 * Loads all fixtures as app-level data: camelCase and typed against `src/types/todoist`,
 * so fixture/type drift is a compile error.
 * @returns {{ tasks: Task[]; contexts: Context[]; user: User; comments: Record<string, Comment[]>; activity: Record<string, ActivityEvent[]> }} The typed fixture data.
 */
export function loadFixtures(): {
    tasks: Task[];
    contexts: Context[];
    user: User;
    comments: Record<string, Comment[]>;
    activity: Record<string, ActivityEvent[]>;
} {
    const asCamel = <T>(name: Parameters<typeof rawFixture>[0]): T =>
        toCamel(rawFixture(name)) as T;
    // The list endpoints are recorded as paginated envelopes, matching the wire
    // format the app expects (tasks.results / projects.results).
    return {
        tasks: asCamel<{ results: Task[] }>("tasks").results ?? [],
        contexts: asCamel<{ results: Context[] }>("projects").results ?? [],
        user: asCamel<User>("user"),
        comments: asCamel<Record<string, Comment[]>>("comments"),
        activity: asCamel<Record<string, ActivityEvent[]>>("activity"),
    };
}
