const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: './src/js/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    resolve: {
        alias: {
            svelte: path.resolve('node_modules', 'svelte/src/runtime')
        },
        extensions: ['.mjs', '.js', '.svelte'],
        mainFields: ['svelte', 'browser', 'module', 'main'],
        conditionNames: ['svelte', 'browser', 'import']
    },
    module: {
        rules: [
            {
                test: /\.svelte$/,
                use: 'svelte-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/index.html',
            filename: 'index.html',
        }),
        new Dotenv()
    ],
    devServer: {
        hot: false,
        liveReload: true
    },
};
