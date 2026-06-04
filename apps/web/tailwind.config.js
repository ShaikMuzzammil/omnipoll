/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand
        terracotta: { DEFAULT: "#E07A5F", dark: "#C9674F", light: "#EE9B85" },
        sage: { DEFAULT: "#81B29A", dark: "#6A9A82", light: "#9DCAB4" },
        charcoal: { DEFAULT: "#2D3748", dark: "#1A202C", light: "#4A5568" },
        parchment: "#F4EDE4",
        cream: "#FAF7F4",
        slate: "#718096",
        clay: "#B5927A",
        crimson: "#C84B4B",
        "warm-white": "#FEFCFA",
        // Chart palette
        chart: {
          1: "#E07A5F",
          2: "#81B29A",
          3: "#F2CC8F",
          4: "#7B9EA8",
          5: "#D4A574",
          6: "#9B89AC",
          7: "#5C8FAA",
          8: "#E8B4A2",
        },
      },
      fontFamily: {
        playfair: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-ring": { "0%": { transform: "scale(.33)" }, "80%, 100%": { opacity: "0" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "count-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "emoji-fall": { "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" }, "100%": { transform: "translateY(100vh) rotate(360deg)", opacity: "0" } },
        glow: { "0%, 100%": { boxShadow: "0 0 5px rgba(224,122,95,0.3)" }, "50%": { boxShadow: "0 0 20px rgba(224,122,95,0.8)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite linear",
        "pulse-ring": "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "count-up": "count-up 0.3s ease-out",
        "emoji-fall": "emoji-fall 3s linear forwards",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
