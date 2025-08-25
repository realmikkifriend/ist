import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import functional from "eslint-plugin-functional";
import svelte from "eslint-plugin-svelte";
import ts from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import svelteConfig from "./svelte.config.mjs";
import vitest from "@vitest/eslint-plugin";

const noTypesOrInterfaces = [
    {
        selector: "TSTypeAliasDeclaration",
        message: "Types are only allowed in src/types. Please import them.",
    },
    {
        selector: "TSInterfaceDeclaration",
        message: "Interfaces are only allowed in src/types. Please import them.",
    },
];

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
    ...ts.configs.recommendedTypeChecked,
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
            "max-lines": ["warn", { max: 130, skipComments: true, skipBlankLines: true }],
            "max-depth": ["warn", 2],
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
            "jsdoc/require-param-type": "warn",
        },
    },
    // -----------------------------------
    // `     eslint-plugin-functional Configuration
    functional.configs.all,
    functional.configs.disableTypeChecked,
    {
        files: ["src/**/*.ts", "src/**/*.svelte"],
        rules: {
            complexity: ["warn", { max: 7 }],
            "max-lines-per-function": [
                "warn",
                { max: 45, skipComments: true, skipBlankLines: true },
            ],
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
            "no-restricted-syntax": ["warn", ...noTypesOrInterfaces],
        },
    },
    {
        files: ["src/services/**/*.ts"],
        ignores: ["src/services/toastService.ts"],
        rules: {
            "no-restricted-syntax": [
                "warn",
                {
                    selector: "CallExpression[callee.property.name='set']",
                    message: "Setting stores is only allowed in top-level components.",
                },
                {
                    selector: "CallExpression[callee.property.name='update']",
                    message: "Updating stores is only allowed in top-level components.",
                },
                ...noTypesOrInterfaces,
            ],
        },
    },
    {
        files: ["src/services/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/services/toastService"],
                            message: "Services files can't trigger toasts directly.",
                        },
                    ],
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
            parser: svelte.parser,
            parserOptions: {
                parser: ts.parser,
                projectService: true,
                extraFileExtensions: [".svelte"],
                svelteFeatures: {
                    experimentalGenerics: true,
                    runes: true,
                },
                svelteConfig,
            },
        },
        rules: {
            "max-lines": ["warn", { max: 140, skipComments: true, skipBlankLines: true }],
            "max-depth": ["warn", 2],
            "no-restricted-syntax": [
                "warn",
                {
                    selector: "TSTypeAliasDeclaration",
                    message: "Types are only allowed in src/types. Please import them.",
                },
                {
                    selector: "TSInterfaceDeclaration",
                    message: "Interfaces are only allowed in src/types. Please import them.",
                },
            ],
            "no-restricted-imports": [
                "warn",
                {
                    name: "svelte/store",
                    importNames: ["writable"],
                    message:
                        "Avoid importing `writable`. Migrate state management to Svelte 5 runes.",
                },
            ],
            "functional/no-let": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
            "svelte/no-add-event-listener": "warn",
            "svelte/button-has-type": "warn",
            "svelte/prefer-class-directive": "warn",
            "svelte/prefer-style-directive": "warn",
            "svelte/sort-attributes": "warn",
            "svelte/require-stores-init": "warn",
        },
    },
    {
        files: ["**/*.svelte"],
        ignores: [
            "src/html/AppMethods.svelte",
            "src/html/AppStateMutators.svelte",
            "src/html/OAuthCallback.svelte",
            "src/html/sidebar/Contexts.svelte",
            "src/html/task/dynalist/DynalistAuthRequest.svelte",
        ],
        rules: {
            "no-restricted-syntax": [
                "warn",
                {
                    selector: "CallExpression[callee.property.name='set']",
                    message: "Setting stores is only allowed in top-level/auth components.",
                },
                {
                    selector: "CallExpression[callee.property.name='update']",
                    message: "Updating stores is only allowed in top-level/auth components.",
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
            globals: globals.vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
            "functional/no-let": "off",
            "functional/no-promise-reject": "off",
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
