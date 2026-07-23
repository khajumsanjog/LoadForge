/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090d16',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
        },
        brand: {
          500: '#0ea5e9',
          600: '#0284c7',
          400: '#38bdf8',
        }
      }
    },
  },
  plugins: [],
}
