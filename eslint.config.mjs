import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import svelteConfig from "./svelte.config.mjs";
import vitest from "@vitest/eslint-plugin";

export default defineConfig([
    {
        files: ["**/*"],
        rules: {
            "no-console": ["warn", { allow: ["error"] }],
            "max-params": ["error", 4],
        },
    },
    // -----------------------------------
    // `     General JavaScript Configuration
    {
        files: ["**/*.{js,mjs,cjs}"],
        extends: [js.configs.recommended],
        languageOptions: {
            sourceType: "module",
            globals: globals.browser,
        },
    },

    // -----------------------------------
    // `     TypeScript Configuration
    ...tseslint.configs.recommendedTypeChecked,
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
            globals: globals.browser,
        },
        rules: {
            "max-lines": ["error", { max: 140, skipComments: true, skipBlankLines: true }],
            "max-depth": ["error", 2],
        },
    },

    // -----------------------------------
    // `     JSDoc Configuration (for TypeScript files)
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
    // `     eslint-plugin-functional Configuration
    functional.configs.all,
    functional.configs.disableTypeChecked,
    {
        files: ["src/**/*.ts", "src/**/*.svelte"],
        rules: {
            complexity: ["error", { max: 10 }],
        },
    },
    // -----------------------------------
    // `     Architectural Boundaries
    {
        files: ["src/utils/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["../services/*"],
                            message: "Utilities can't use services.",
                        },
                        {
                            group: ["../stores/*"],
                            message: "Utilities can't access stores.",
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        ignores: ["src/types/**/*.ts", "src/types/**/*.tsx"],
        rules: {
            "no-restricted-syntax": [
                "error",
                {
                    selector: "TSTypeAliasDeclaration",
                    message: "Types are only allowed in src/types. Please import them.",
                },
                {
                    selector: "TSInterfaceDeclaration",
                    message: "Interfaces are only allowed in src/types. Please import them.",
                },
            ],
        },
    },
    // -----------------------------------
    // `     Svelte Configuration
    ...svelte.configs.recommended,
    {
        files: ["**/*.svelte"],
        languageOptions: {
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
        rules: {
            "max-lines": ["error", { max: 90, skipComments: true, skipBlankLines: true }],
            "max-depth": ["error", 2],
            "functional/no-let": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
    // -----------------------------------
    // `     Vitest Configuration (for test files)
    {
        files: ["tests/**/*.ts"],
        plugins: {
            vitest,
        },
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
            sourceType: "module",
            globals: globals.vitest, // Add Vitest globals
        },
        rules: {
            ...vitest.configs.recommended.rules,
            "functional/no-let": "off",
            "functional/no-promise-reject": "off", // Disable for test files
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },
]);
