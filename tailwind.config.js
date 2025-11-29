/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#314855",
          sky: "#5cc3e8",
          sunshine: "#ffdb00",
          mint: "#79ceb8",
          coral: "#e95f5c",
        },
      },
    },
  },
  plugins: [],
};
