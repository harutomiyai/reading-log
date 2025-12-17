/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ← ここを src フォルダ限定に戻しました
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
