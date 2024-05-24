/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    theme: {
        extend: {
            colors: {
                priority: {
                    1: "#8b8b8b", // grey
                    2: "#5297ff", // blue
                    3: "#ff9a14", // tangerine
                    4: "#ff7066", // red
                },
            },
        },
    },
    plugins: [require("daisyui")],
    daisyui: {
        logs: false,
    },
};
