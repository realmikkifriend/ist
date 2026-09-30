import path from "node:path";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// Project root (where this config, .env, and index.html live).
const root = path.dirname(fileURLToPath(import.meta.url));

// The app source reads process.env.TODOIST_* (statically replaced at build
// time, as it did under webpack's dotenv-webpack). Vite does not define
// process.env in the browser, so load the values (.env first, then the real
// environment, matching the old `systemvars: true`) and define each key.
const ENV_KEYS = ["TODOIST_CLIENT_ID", "TODOIST_CLIENT_SECRET", "TODOIST_REDIRECT_URI"];

// @doist/todoist-sdk lazily imports Node-only modules (undici for its HTTP
// dispatcher, fs + path for file-path uploads). Alias them to an empty stub so
// they are not pulled into the browser bundle (the old webpack config used
// alias/fallback false for the same purpose).
const nodeStub = path.resolve(root, "vite-node-stub.js");

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, root, "");
    // JSON.stringify(undefined) is undefined, not a string; a missing key must
    // become the literal `undefined` (the code types these as `string | undefined`).
    const envValue = (key) => (env[key] !== undefined ? JSON.stringify(env[key]) : "undefined");
    return {
        plugins: [
            svelte(),
            svelteTesting(),
            tailwindcss(),
            {
                // The browser has no `process` global. In production the
                // `define` below statically replaces the reads, but Vite 8 only
                // applies `define` at build time, so the dev server needs a
                // runtime polyfill injected into index.html.
                name: "process-env-dev-polyfill",
                apply: "serve",
                transformIndexHtml(html) {
                    const envGlobal = Object.fromEntries(ENV_KEYS.map((key) => [key, env[key]]));
                    return html.replace(
                        "</head>",
                        `<script>window.process = { env: ${JSON.stringify(envGlobal)} };</script>\n</head>`,
                    );
                },
            },
        ],
        define: Object.fromEntries(ENV_KEYS.map((key) => [`process.env.${key}`, envValue(key)])),
        resolve: {
            alias: {
                undici: nodeStub,
                fs: nodeStub,
                path: nodeStub,
            },
        },
        build: {
            outDir: "dist",
        },
        server: {
            // webpack's dev server defaulted to 8080; keep it so the developer
            // workflow (and any bookmarked URLs) are unchanged.
            port: 8080,
            // The live e2e project and OAuth flow rely on the /oauth proxy to
            // todoist.com (the old webpack devServer.proxy).
            proxy: {
                "/oauth": {
                    target: "https://todoist.com",
                    changeOrigin: true,
                    secure: true,
                },
            },
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: ["./vitest-setup.js"],
            // The Playwright specs in tests/e2e are run by `npm run test:e2e`,
            // not Vitest. Without this exclude, Vitest's default `**/*.spec.ts`
            // pattern loads them and fails with "did not expect test.describe()".
            exclude: [...configDefaults.exclude, "tests/e2e/**"],
            // No unit tests exist yet, so don't fail on an empty run.
            passWithNoTests: true,
            coverage: {
                provider: "v8",
                reporter: ["text", "json", "html"],
                exclude: [
                    "node_modules/**",
                    "tests/**",
                    "**/*.spec.js",
                    "**/*.config.*",
                    "vitest-setup.js",
                ],
            },
        },
    };
});
