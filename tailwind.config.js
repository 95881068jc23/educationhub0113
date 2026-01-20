/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Heiti SC"', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"Songti SC"', '"Noto Serif SC"', '"Times New Roman"', 'serif'],
      },
      colors: {
        'marvel-primary': '#102a43', // navy-900
        'marvel-secondary': '#d4af37', // gold-500
        brand: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43', // Matches navy-900
          950: '#061325',
        },
        // Professional Navy & Gold Theme
        navy: {
            50: '#f0f4f8',
            100: '#d9e2ec',
            200: '#bcccdc',
            300: '#9fb3c8',
            400: '#829ab1',
            500: '#627d98',
            600: '#486581',
            700: '#334e68',
            800: '#243b53',
            900: '#102a43', // Primary Navy
            950: '#061325',
        },
        gold: {
            50: '#fffdf5',
            100: '#fff8e1',
            200: '#ffecb3',
            300: '#ffe082',
            400: '#ffd54f',
            500: '#d4af37', // Metallic Gold (Primary Accent)
            600: '#b8962e',
            700: '#9c7d25',
            800: '#80641c',
            900: '#644b13',
            950: '#48320a',
        }
      },
    },
  },
  plugins: [],
}
