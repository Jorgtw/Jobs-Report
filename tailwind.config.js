/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Sage surfaces only: preserve text, status and action color palettes.
      backgroundColor: {
        slate: { 50: '#e7efe8', 100: '#d4e2d6', 200: '#c3d5c6' },
        gray: { 50: '#e7efe8', 100: '#d4e2d6', 200: '#c3d5c6' },
      },
      borderColor: {
        DEFAULT: '#b6cbb9',
        slate: { 100: '#ccdacf', 200: '#b6cbb9', 300: '#9bb69f' },
        gray: { 100: '#ccdacf', 200: '#b6cbb9', 300: '#9bb69f' },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
