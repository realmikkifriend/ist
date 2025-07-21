import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),

    compilerOptions: {
        // Enable TypeScript support
        enableSourcemap: true,
    },

    kit: {
        adapter: undefined,
        files: {
            assets: "src/css",
            hooks: {
                client: "src/js/hooks.client",
                server: "src/js/hooks.server",
            },
            lib: "src/js",
            params: "src/js/params",
            routes: "src/html",
            serviceWorker: "src/js/service-worker",
            appTemplate: "src/html/index.html",
        },
    },

    // Vite plugin options
    vitePlugin: {
        // Exclude files that should not be processed by Vite
        exclude: ["dist/**/*", "node_modules/**/*"],
        // Enable inspector for development
        inspector: {
            toggleKeyCombo: "meta-shift",
            holdMode: true,
            showToggleButton: "always",
            toggleButtonPos: "bottom-right",
        },
    },

    // Compiler warnings configuration
    onwarn: (warning, handler) => {
        // Disable a11y warnings if needed (uncomment if you want to suppress them)
        // if (warning.code.startsWith('a11y-')) return;

        // Handle other warnings normally
        handler(warning);
    },
};

export default config;
