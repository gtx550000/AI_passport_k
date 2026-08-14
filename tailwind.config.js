/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- เพิ่มบรรทัดนี้
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}