import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import svelteConfig from "./svelte.config.mjs";
import vitest from "@vitest/eslint-plugin";

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
        files: ["**/*.svelte"],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: [".svelte"],
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
        files: ["src/**/*.ts", "src/**/*.svelte"],
        rules: {
            complexity: ["error", { max: 10 }],
        },
    },
    {
        files: ["tests/**/*.ts"], // Specific configuration for TypeScript test files
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
            sourceType: "module",
            globals: globals.vitest, // Add Vitest globals
        },
        rules: {
            "functional/no-let": "off",
            "functional/no-promise-reject": "off", // Disable for test files
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
            // Relax some rules that might conflict with testing patterns
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-explicit-any": "off", // Temporarily disable to see if it resolves issues
        },
    },
    {
        files: ["tests/**/*.js"], // Keep existing JS test file configuration
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
    {
        files: ["tests/**/*.ts"],
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
    },
]);
