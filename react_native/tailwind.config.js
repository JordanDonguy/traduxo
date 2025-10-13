/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg1: {
          light: "#ffffff",
          dark: "#000000",
        },
        bg2: {
          light: "#d4d4d8",
          dark: "#27272a",
        },
        txt: {
          light: "#0f0f0f",
          dark: "#ffffff",
        },
        border: {
          light: "#e5e7eb",
          dark: "#a1a1aa",
        },
        input: {
          light: "#e5e7eb",
          dark: "#52525b",
        },
      }
    },
  },
  plugins: [],
  darkMode: "media",
}

