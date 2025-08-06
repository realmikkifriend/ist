export default {
    project: ["**/*.ts", "**/*.svelte", "**/*.mjs", "**/*.css"],
    ignoreExportsUsedInFile: {
        function: true,
        interface: true,
        type: true,
    },
    ignoreDependencies: ["daisyui"],
    compilers: {
        css: (text: string) =>
            [...text.matchAll(/(?:@(?:import|plugin)\s+"([^"]+)")/g)]
                .join("\n")
                .replace("plugin", "import"),
    },
    webpack: { config: ["webpack.config.mjs"] },
};
