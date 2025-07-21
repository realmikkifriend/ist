import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
    { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
    { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
    // -----------------------------------
    // `     TypeScript
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    // -----------------------------------
    // `     JSDoc
    jsdoc.configs["flat/recommended-typescript"],
    jsdoc.configs["flat/contents-typescript"],
    {
        files: ["**/*.ts"],
        plugins: {
            jsdoc,
        },
        rules: {
            "jsdoc/require-jsdoc": [
                "warn",
                {
                    require: {
                        ArrowFunctionExpression: true,
                    },
                },
            ],
            "jsdoc/no-types": "off",
            "jsdoc/require-param-type": "error",
        },
    },
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
        files: ["**/*.spec.js"],
        rules: Object.fromEntries(
            Object.keys(functional.configs.all.rules).map((rule) => [rule, "off"]),
        ),
    },
]);
