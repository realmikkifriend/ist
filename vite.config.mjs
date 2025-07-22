import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
    plugins: [svelte(), svelteTesting()],
    test: {
        environment: "jsdom",
        setupFiles: ["./vitest-setup.js"],
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
