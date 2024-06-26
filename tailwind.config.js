/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,js,svelte,ts}"],
    darkMode: "class",
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
    plugins: [require("daisyui"), require("@tailwindcss/typography")],
    daisyui: {
        themes: [
            {
                dark: {
                    ...require("daisyui/src/theming/themes")["dark"],
                    primary: "#C23F31", // highlight best option
                    secondary: "#737373", // other options
                    accent: "#242424", // comments background
                    neutral: "#2D2D2D", // card background
                    "base-100": "#1C1C1C", // page background
                    "primary-content": "#e8e8e8", // main text
                },
            },
            "dark",
            "cupcake",
        ],
        logs: false,
    },
};
