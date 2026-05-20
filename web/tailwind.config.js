/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        inter: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        terracotta: "#D96C4A",
        clay: "#C4A882",
        "warm-white": "#FDF9F3",
        cream: "#F5EFE4",
        parchment: "#EDE4D5",
        charcoal: "#2C2C2C",
        slate: "#6B6B6B",
        sage: "#7B9E87",
        crimson: "#C94040",
        "warm-bg": "hsl(42, 33%, 93%)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
