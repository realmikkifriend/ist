import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import Dotenv from "dotenv-webpack";
import sveltePreprocess from "svelte-preprocess";

export default {
    entry: "./src/js/index.ts",
    output: {
        filename: "bundle.js",
        // path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    resolve: {
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
                        preprocess: sveltePreprocess(),
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
