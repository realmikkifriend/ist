/**
 * Playwright global setup: ensures the e2e fixtures exist.
 *
 * Fixtures are not committed. When they are missing, this downloads them from
 * the live Todoist API. If no access token is available yet, the download asks
 * you to paste one (or errors, in a non-interactive run) and saves it to .env
 * for subsequent runs. If the download still fails (no credentials, network),
 * it warns and continues so the rest of the suite runs; only fixture-dependent
 * specs fail in that case.
 */
import { downloadFixtures, hasAllFixtures } from "./download-fixtures.mjs";

export default async function globalSetup() {
    if (hasAllFixtures()) {
        return;
    }
    try {
        const downloaded = await downloadFixtures();
        if (downloaded) {
            console.log("[e2e] Downloaded Todoist fixtures.");
        }
    } catch (error) {
        console.warn(`[e2e] Could not download fixtures: ${error.message}`);
        console.warn("[e2e] Running without fixtures; fixture-dependent specs will fail.");
    }
}
