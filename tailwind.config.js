/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}", // ← ここを変更しました（すべてのフォルダを見る設定）
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
