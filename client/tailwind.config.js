/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dcd0',
          300: '#9cc3b1',
          400: '#6ea38e',
          500: '#4d8771',
          600: '#3a6c59',
          700: '#2f5748',
          800: '#27463b',
          900: '#1e382f',
          950: '#0f201b',
        },
      },
    },
  },
  plugins: [],
}
