/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        base: 16,
        lg: 20,
        xl: 24,
        "2xl": 32,
      },
      fontFamily: {
        sans: ["OpenSans-Regular", "sans-serif"],
      },
    },
  },
  plugins: [],
  darkMode: "media",
}
