import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";

export default defineConfig([
    { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
    { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
    // -----------------------------------
    // `     eslint-plugin-svelte
    ...svelte.configs.recommended,
    // -----------------------------------
    // `     eslint-plugin-functional
    // functional.configs.externalVanillaRecommended,
    // functional.configs.recommended,
    // functional.configs.strict,
    // functional.configs.stylistic,
    functional.configs.all,
    functional.configs.disableTypeChecked,
    {
        rules: {},
    },
]);
