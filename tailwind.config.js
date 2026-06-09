/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tahoma", "Geneva", "MS Sans Serif", "sans-serif"],
        mono: ["Lucida Console", "Courier New", "Consolas", "monospace"],
      },
      colors: {
        "bg-base":     "#0A0A1A",
        "bg-surface":  "#C0C0C0",
        "bg-card":     "#FFFFFF",
        "bg-elevated": "#D4D0C8",
        border:        "#808080",
        accent:        "#00E5FF",
        p1: "#FF1744",
        p2: "#FF9100",
        p3: "#00B0FF",
        p4: "#B388FF",
      },
      borderRadius: {
        card: "0px",
      },
      boxShadow: {
        card:     "none",
        elevated: "2px 2px 0 0 rgba(0,0,0,0.55)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "inset 0 0 0 2px rgba(192,0,0,0)" },
          "50%":      { boxShadow: "inset 0 0 0 2px rgba(192,0,0,0.85)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.4s steps(1, end) infinite",
      },
    },
  },
  plugins: [],
};
