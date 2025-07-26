import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import svelteConfig from "./svelte.config.mjs";

export default defineConfig([
    { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"] },
    { files: ["**/*.js"], languageOptions: { sourceType: "module" } },
    { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
    // -----------------------------------
    // `     TypeScript
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
            globals: globals.browser,
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
                    publicOnly: true,
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
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: [".svelte", ".svelte.ts"],
                parser: "@typescript-eslint/parser",
                svelteFeatures: {
                    experimentalGenerics: true,
                },
                svelteConfig,
            },
        },
    },
    // -----------------------------------
    // `     eslint-plugin-functional
    // functional.configs.externalVanillaRecommended,
    // functional.configs.recommended,
    // functional.configs.strict,
    // functional.configs.stylistic,
    functional.configs.all,
    functional.configs.disableTypeChecked,
    {
        files: ["**/*.svelte"],
        rules: {
            "functional/no-let": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        files: ["**/*.spec.js"],
        rules: Object.fromEntries(
            Object.keys(functional.configs.all.rules).map((rule) => [rule, "off"]),
        ),
    },
]);
