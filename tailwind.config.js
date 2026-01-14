/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'marvel-primary': '#059669', // emerald-600
        'marvel-secondary': '#10b981', // emerald-500
      },
    },
  },
  plugins: [],
}
