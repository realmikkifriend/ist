/**
 * Downloads e2e fixtures from the live Todoist API.
 *
 * Records the startup endpoints the app calls:
 *   - GET /api/v1/tasks?limit=200
 *   - GET /api/v1/projects
 *   - GET /api/v1/user
 *   - GET /api/v1/tasks/{id}/comments        (tasks with notes)
 *   - GET /api/v1/activity_logs?…            (first batch of due tasks)
 *
 * Writes the responses (snake_case wire format) to tests/e2e/fixtures/:
 *   tasks.json and projects.json — the paginated envelopes ({ results: [...], ... })
 *   exactly as the API returns them (results trimmed); user.json — the user object;
 *   comments.json (taskId -> comments[]), activity.json (taskId -> activity events[]).
 *
 * Authentication: uses TODOIST_ACCESS_TOKEN from the environment or .env when
 * present. When it is missing, the script asks you to paste a token (copy it
 * from a normal logged-in browser, where the app keeps it under the
 * `todoist_access_token` localStorage key) and saves it to .env
 * (TODOIST_ACCESS_TOKEN) for subsequent runs. In a non-interactive context it
 * instead errors with instructions to add the token to .env.
 *
 * A browser-automated login is deliberately avoided: Todoist's Google sign-in
 * refuses the Playwright/Chromium head.
 *
 * Skips silently when all fixture files already exist.
 *
 * Run directly: `node tests/e2e/download-fixtures.mjs`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, "fixtures");
const BASE_URL = "https://api.todoist.com/api/v1";
const MAX_TASKS = 200;
const MAX_COMMENTS_PER_TASK = 20;
const MAX_ACTIVITY_PER_TASK = 20;
const MAX_TASKS_WITH_ACTIVITY = 50;

/** The fixture files expected in the fixtures directory. */
export const FIXTURE_FILES = [
    "tasks.json",
    "projects.json",
    "user.json",
    "comments.json",
    "activity.json",
];

/** True when every expected fixture file already exists. */
export function hasAllFixtures() {
    return FIXTURE_FILES.every((file) => existsSync(path.join(FIXTURE_DIR, file)));
}

/** Minimal .env reader (key=value lines), so the script has no extra npm deps. */
function loadEnvFile() {
    const values = {};
    const envPath = path.join(HERE, "..", "..", ".env");
    if (!existsSync(envPath)) {
        return values;
    }
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (match) {
            values[match[1]] = match[2].replace(/^["']|["']$/g, "");
        }
    }
    return values;
}

/** Reads an env var (environment first, then .env). */
function getEnvValue(name) {
    const env = loadEnvFile();
    return process.env[name] || env[name] || null;
}

function getAccessToken() {
    return getEnvValue("TODOIST_ACCESS_TOKEN");
}

/**
 * Persists the access token in .env so later runs skip the prompt.
 * @param {string} token - The access token to persist.
 */
export function saveTokenToEnv(token) {
    const envPath = path.join(HERE, "..", "..", ".env");
    const key = "TODOIST_ACCESS_TOKEN";
    const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
    const hasKey = lines.some((line) => line.startsWith(`${key}=`));
    const next = hasKey
        ? lines.map((line) => (line.startsWith(`${key}=`) ? `${key}=${token}` : line))
        : [...lines, `${key}=${token}`];
    writeFileSync(envPath, next.join("\n"));
}

/** Prompts on the terminal for a line of input and resolves with it. */
const readLine = async () =>
    new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question("Paste your Todoist access token and press Enter: ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });

/**
 * Obtains an access token when none is configured: prompts interactively when
 * possible, otherwise throws with instructions to add it to .env.
 * @returns {Promise<string>} The Todoist access token.
 */
async function acquireToken() {
    if (process.stdin.isTTY) {
        console.log("No Todoist access token found.");
        console.log("Log in to Ist (or Todoist) in your regular browser, then copy the token");
        console.log("(localStorage key: todoist_access_token) and paste it below.");
        const token = await readLine();
        if (!token) {
            throw new Error("No token provided; aborting fixture download.");
        }
        return token;
    }
    throw new Error(
        "No Todoist access token found. Add TODOIST_ACCESS_TOKEN to .env (see .env.sample) and re-run.",
    );
}

/**
 * GETs a REST endpoint and returns the parsed JSON body. With
 * `options.optional` a 404 (e.g. no activity logs for a task) resolves to null
 * instead of throwing.
 */
async function apiGet(accessToken, endpoint, { optional = false } = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
        if (optional && response.status === 404) {
            return null;
        }
        throw new Error(`GET ${endpoint} failed: HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * Downloads the startup endpoints and writes the fixture files. When no access
 * token is configured, obtains one (prompt) and saves it to .env.
 * @returns {Promise<boolean>} true when fixtures were (re)downloaded, false when skipped.
 */
export async function downloadFixtures() {
    if (hasAllFixtures()) {
        return false;
    }

    const existingToken = getAccessToken();
    const accessToken = existingToken ?? (await acquireToken());
    if (!existingToken) {
        saveTokenToEnv(accessToken);
        console.log("Saved the access token to .env (TODOIST_ACCESS_TOKEN).");
    }

    const [rawTasks, projects, user] = await Promise.all([
        apiGet(accessToken, "/tasks?limit=200"),
        apiGet(accessToken, "/projects"),
        apiGet(accessToken, "/user"),
    ]);
    // List endpoints return a paginated envelope: { results: [...], next_token, ... }.
    const tasks = (rawTasks.results || []).slice(0, MAX_TASKS);

    // Comments: only for tasks that actually have notes (trimmed to 20 each).
    const comments = {};
    for (const task of tasks.filter((t) => (t.note_count || 0) > 0)) {
        const response = await apiGet(accessToken, `/tasks/${task.id}/comments`);
        comments[task.id] = (response.results || []).slice(0, MAX_COMMENTS_PER_TASK);
    }

    // Activity: completion history for the first batch of due tasks (trimmed to 20 each).
    const activity = {};
    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dueTasks = tasks.filter((t) => t.due && (t.due.date || t.due.datetime));
    for (const task of dueTasks.slice(0, MAX_TASKS_WITH_ACTIVITY)) {
        const query =
            `?date_from=${dateFrom}&object_event_types=task:completed` +
            `&object_type=item&object_id=${task.id}&limit=100`;
        const response = await apiGet(accessToken, `/activity_logs${query}`, { optional: true });
        activity[task.id] = (response?.results || []).slice(0, MAX_ACTIVITY_PER_TASK);
    }

    mkdirSync(FIXTURE_DIR, { recursive: true });
    // Keep the wire envelope (with trimmed results) so tasks.json/projects.json
    // can be served verbatim as mocked api.todoist.com responses.
    writeFileSync(path.join(FIXTURE_DIR, "tasks.json"), JSON.stringify({ ...rawTasks, results: tasks }, null, 2));
    writeFileSync(path.join(FIXTURE_DIR, "projects.json"), JSON.stringify(projects, null, 2));
    writeFileSync(path.join(FIXTURE_DIR, "user.json"), JSON.stringify(user, null, 2));
    writeFileSync(path.join(FIXTURE_DIR, "comments.json"), JSON.stringify(comments, null, 2));
    writeFileSync(path.join(FIXTURE_DIR, "activity.json"), JSON.stringify(activity, null, 2));
    return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    downloadFixtures()
        .then((downloaded) => {
            if (downloaded) {
                console.log(`Fixtures written to ${FIXTURE_DIR}`);
            } else {
                console.log("All fixtures already present; nothing to do.");
            }
        })
        .catch((error) => {
            console.error(error.message);
            process.exit(1);
        });
}
