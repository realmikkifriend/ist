import { configDefaults, defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [svelte(), svelteTesting(), tailwindcss()],
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
});
