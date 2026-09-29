export default {
    project: ["**/*.ts", "**/*.svelte", "**/*.mjs", "**/*.css"],
    // Launched via a shell command in playwright.config.ts, not imported.
    // fixtures.ts is consumed by the fixture-based e2e specs (Phase 2.0.3).
    entry: [
        "tests/e2e/static-server.mjs",
        "tests/e2e/download-fixtures.mjs",
        "tests/e2e/fixtures.ts",
    ],
    ignoreExportsUsedInFile: {
        function: true,
        interface: true,
        type: true,
    },
    webpack: { config: ["webpack.config.mjs"] },
};
