/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/html/**/*.html',
    './src/js/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui')
  ],
}

