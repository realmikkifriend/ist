const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
    entry: "./src/js/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    resolve: {
        alias: {
            svelte: path.resolve("node_modules", "svelte/src/runtime"),
        },
        extensions: [".mjs", ".js", ".ts", ".svelte"],
        mainFields: ["svelte", "browser", "module", "main"],
        conditionNames: ["svelte", "browser", "import"],
    },
    module: {
        rules: [
            {
                test: /\.svelte$/,
                use: {
                    loader: "svelte-loader",
                    options: {
                        preprocess: require("svelte-preprocess")(),
                    },
                },
            },
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false,
                },
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/html/index.html",
            filename: "index.html",
        }),
        new Dotenv({
            systemvars: true,
        }),
    ],
    infrastructureLogging: {
        level: "warn",
    },
    devServer: {
        hot: false,
        liveReload: true,
    },
};
